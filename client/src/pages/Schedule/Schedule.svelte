<script>
    import { onMount } from 'svelte';
    import { BASE_URL } from '../../stores/global';
    import toast, { Toaster } from 'svelte-french-toast';
    import { user } from '../../stores/userStore';
    import io from 'socket.io-client';

    const socket = io($BASE_URL);

    let bookings = {};
    let userBookings = {};
    let loading = true;


    onMount(() => {
        fetchBookings();
        socket.on('bookingUpdate', fetchBookings);
    });

    async function fetchBookings() {
        try {
            const response = await fetch($BASE_URL + '/api/bookings/four-weeks');
            if (response.ok) {
                bookings = await response.json();
                preprocessBookings(); 
                loading = false;
            } else {
                throw new Error('Server responded with an error');
            }
        } catch (error) {
            toast.error('Error fetching bookings: ' + error.message);
        }
    }

    function preprocessBookings() {
        const updatedUserBookings = {}; 
        Object.keys(bookings).forEach(date => {
            const morningBooking = bookings[date].morning.bookings.find(booking => booking.name === $user.name);
            const afternoonBooking = bookings[date].afternoon.bookings.find(booking => booking.name === $user.name);

            updatedUserBookings[date] = {
                morning: morningBooking,
                afternoon: afternoonBooking,
            };
        });
        userBookings = updatedUserBookings; 
    }

    function formatDate(dateString) {
        const date = new Date(dateString.split('-').reverse().join('-'));
        return date.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    function processBookings(date) {
        const combinedBookings = {};

        bookings[date].morning.bookings.forEach(booking => {
            combinedBookings[booking.name] = '☀️';
        });

        bookings[date].afternoon.bookings.forEach(booking => {
            combinedBookings[booking.name] = combinedBookings[booking.name] ? '☀️🌚' : '🌚';
        });

        return combinedBookings;
    }

    async function bookShift(date, type) {
        fetch($BASE_URL + '/api/bookings/book-shift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shift_date: date, shift_type: type }),
        }).then(response => {
            if (!response.ok) {
                toast.error('error');
            } else {
                toast.success('Shift successfully booked!');
            }
        });
    }

    async function cancelShift(bookingId) {
        fetch($BASE_URL + '/api/bookings/cancel-shift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId }),
        }).then(response => {
            if (!response.ok) {
                toast.error('error');
            } else {
                toast.success('Shift successfully cancled!');
            }
        });
    }

</script>

<Toaster />
<div class="booking-container">
    <h1>Desk Bookings</h1>
    {#if loading}
        <img src="../../../public/img/infinite-spinner.svg" style="width:100px height=100px" alt="Spinner" />
    {:else}
        {#each Object.keys(bookings) as date (date)}
            <div class="date-row">
                <div>{formatDate(date)}</div>
                <div class="shift-info">
                    <p style="margin-right:30px">☀️ - {bookings[date].morning.spotsLeft} spots left</p>
                    <p>🌚 - {bookings[date].afternoon.spotsLeft} spots left</p>
                </div>
            </div>
            {#if !userBookings[date].morning}
                <button class="book-button" on:click={() => bookShift(date, 'morning')}> Book Morning </button>
            {:else}
                <button class="cancel-button" on:click={() => cancelShift(userBookings[date].morning.bookingId)}>Cancel Morning</button>
            {/if}

            {#if !userBookings[date].afternoon}
                <button class="book-button" on:click={() => bookShift(date, 'afternoon')}>Book Afternoon</button>
            {:else}
                <button class="cancel-button" on:click={() => cancelShift(userBookings[date].afternoon.bookingId)}>Cancel Afternoon</button>
            {/if}
            <div class="bookings-list">
                {#each Object.entries(processBookings(date)) as [name, icons]}
                    <div class="booking-entry">{name} - {icons}</div>
                {/each}
            </div>
        {/each}
    {/if}
</div>

<style>
    .booking-container {
        max-width: 600px;
        margin: auto;
    }
    .date-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
    }
    .shift-info {
        display: flex;
        align-items: center;
    }
    .bookings-list {
        margin-top: 10px;
        border-bottom: 1px solid #ccc;
    }
    .booking-entry {
        padding: 5px;
        margin-bottom: 5px;
        border-radius: 5px;
    }

    .book-button {
        background-color: #f0f0f0;
        color: #4c6fff;
    }

    .cancel-button {
        background-color: #ff8b8b;
        color: #f0f0f0;
    }
</style>
