<script>
    import { onMount } from 'svelte';
    import { BASE_URL } from '../../stores/global';
    import toast, { Toaster } from 'svelte-french-toast';
    import { user } from '../../stores/userStore';
    import io from 'socket.io-client';
    import ConfirmationModal from '../../component/ConfirmationModal/ConfirmationModal.svelte';


    const socket = io($BASE_URL);

    let bookings = {};
    let userBookings = {};
    let loading = true;
    let closedDays = [];
    let currentUser = $user;
    let showConfirmationModal = false;
    let currentBookingId = null;

    onMount(() => {
        if ($user) {
            fetchClosedDays();
            fetchBookings();
            socket.on('bookingUpdate', fetchBookings);
        }
        return () => {
            socket.disconnect();
        };
    });

    function isDisabled(dateString) {
        const givenDate = new Date(dateString.split('-').reverse().join('-'));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return givenDate < today;
    }

    async function fetchBookings() {
        try {
            const response = await fetch($BASE_URL + '/api/bookings/four-weeks');
            if (response.ok) {
                bookings = await response.json();
                preprocessBookings();
                loading = false;
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Server responded with an error');
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

    function getWeekNumber(date) {
        const currentDate = new Date(date.split('-').reverse().join('-'));
        const startDate = new Date(currentDate.getFullYear(), 0, 1);
        const days = Math.floor((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil(days / 7);
    }

    function processBookings(date) {
        const combinedBookings = {};

        bookings[date].morning.bookings.forEach(booking => {
            combinedBookings[booking.name] = {
                name: booking.name,
                icon: '☀️',
                morningID: booking.bookingId,
                afternoonID: null,
            };
        });

        bookings[date].afternoon.bookings.forEach(booking => {
            if (combinedBookings[booking.name]) {
                combinedBookings[booking.name].icon += '🌚';
                combinedBookings[booking.name].afternoonID = booking.bookingId;
            } else {
                combinedBookings[booking.name] = {
                    name: booking.name,
                    icon: '🌚',
                    morningID: null,
                    afternoonID: booking.bookingId,
                };
            }
        });

        return Object.values(combinedBookings);
    }

    async function bookShift(date, type) {
        try {
            const response = await fetch($BASE_URL + '/api/bookings/book-shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_date: date, shift_type: type }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error booking shift');
            }
        } catch (error) {
            toast.error('Booking failed: ' + error.message);
        }
    }

    async function cancelShift(bookingId) {
        try {
            const response = await fetch($BASE_URL + '/api/bookings/cancel-shift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId }),
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error canceling shift');
            }
        } catch (error) {
            toast.error('Cancellation failed: ' + error.message);
        }
    }

    async function fetchClosedDays() {
        try {
            const response = await fetch($BASE_URL + '/api/closed-days');

            const data = await response.json();
            closedDays = data.map(period => ({
                start: new Date(period.start_date),
                end: new Date(period.end_date),
                reason: period.reason,
            }));
            if (!response.ok) {
                throw new Error(data.message);
            }
        } catch (error) {
            toast.error('Error fetching closed days: ' + error.message);
        }
    }

    function isClosedDay(dateString) {
        const givenDate = new Date(dateString.split('-').reverse().join('-'));
        return closedDays.some(period => givenDate >= period.start && givenDate <= period.end);
    }

    function openConfirmationModal(bookingId) {
        currentBookingId = bookingId;
        showConfirmationModal = true;
    }

    async function confirmCancellation() {
        if (currentBookingId) {
            await cancelShift(currentBookingId);
        }
        showConfirmationModal = false;
        currentBookingId = null;
    }

    function cancelCancellation() {
        showConfirmationModal = false;
        currentBookingId = null;
    }
</script>

<Toaster />

{#if showConfirmationModal}
    <ConfirmationModal
        message="Are you sure you want to cancel this booking?"
        onConfirm={confirmCancellation}
        onCancel={cancelCancellation}
    />
{/if}

<div class="booking-container">
    <h1>Desk Bookings</h1>
    {#if loading}
        <img src="../../../public/img/infinite-spinner.svg" style="width:100px height=100px" alt="Spinner" />
    {:else}
        {#each Object.keys(bookings) as date (date)}
            {#if new Date(date.split('-').reverse().join('-')).getDay() == 1}
                <div class="week-number">Week {getWeekNumber(date)}</div>
            {/if}
            <div class="date-row">
                <div class="date">{formatDate(date)}</div>
                {#if isClosedDay(date)}
                    <div class="closed-day">Office Closed</div>
                {:else}
                    <div class="shift-info">
                        <p style="margin-right:30px">☀️ - {bookings[date].morning.spotsLeft} spots left</p>
                        <p>🌚 - {bookings[date].afternoon.spotsLeft} spots left</p>
                    </div>
                {/if}

                {#if !isClosedDay(date)}
                    {#if !userBookings[date].morning}
                        <button
                            class="book-button"
                            disabled={isDisabled(date) || bookings[date].morning.spotsLeft === 0}
                            on:click={() => bookShift(date, 'morning')}
                        >
                            Book Morning
                        </button>
                    {:else}
                        <button class="cancel-button" disabled={isDisabled(date)} on:click={() => openConfirmationModal(userBookings[date].morning.bookingId)}>
                            Cancel Morning
                        </button>
                    {/if}

                    {#if !userBookings[date].afternoon}
                        <button
                            class="book-button"
                            disabled={isDisabled(date) || bookings[date].afternoon.spotsLeft === 0}
                            on:click={() => bookShift(date, 'afternoon')}
                        >
                            Book Afternoon
                        </button>
                    {:else}
                        <button class="cancel-button" disabled={isDisabled(date)} on:click={() => openConfirmationModal(userBookings[date].afternoon.bookingId)}>
                            Cancel Afternoon
                        </button>
                    {/if}
                {/if}
            </div>
            <div class="bookings-list">
                {#each processBookings(date) as booking}
                    <div class="booking-entry">
                        {#if currentUser.isAdmin === 1}
                            <span>{booking.name} - {booking.icon}</span>
                            {#if !isDisabled(date)}
                                <div class="admin-cancel-button-container">
                                    {#if booking.morningID}
                                        <button class="admin-cancel" on:click={() => openConfirmationModal(booking.morningID)}>☀️</button>
                                    {/if}
                                    {#if booking.afternoonID}
                                        <button class="admin-cancel" on:click={() => openConfirmationModal(booking.afternoonID)}>🌚</button>
                                    {/if}
                                </div>
                            {/if}
                        {:else}
                            <span>{booking.name} - {booking.icon}</span>
                        {/if}
                    </div>
                {/each}
            </div>
        {/each}
    {/if}
</div>

<style>
    .booking-container {
        max-width: calc(100vw - 150px);
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        margin: 20px auto;
        max-width: calc(100vw - 140px);
    }

    .date-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background-color: #f9f9f9;
        margin: 10px 0;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        border-bottom: 1px solid #eee;
        margin-bottom: 5px;
    }

    .date {
        font-weight: bold;
    }

    .shift-info {
        display: flex;
        align-items: center;
    }

    .bookings-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 10px;
        margin-bottom: 50px;
    }

    .booking-entry {
        padding: 5px;
        background-color: #eef;
        border-radius: 5px;
        display: flex;
        justify-content: space-between;
    }

    .book-button,
    .cancel-button {
        padding: 8px 15px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin: 5px;
        transition: background-color 0.2s;
    }

    .book-button {
        background-color: #535bf2;
        color: #fff;
    }

    .book-button:hover {
        background-color: rgb(51, 61, 240);
    }

    .cancel-button {
        background-color: #ff6b6b;
        color: white;
    }

    .cancel-button:hover {
        background-color: #ff4c4c;
    }

    button:disabled {
        background-color: #ccc;
        color: #999;
        cursor: not-allowed;
    }

    button:disabled:hover {
        background-color: #ccc;
    }

    .week-number {
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 4px;
        font-size: 1.4em;
        font-weight: bold;
        text-align: center;
        margin-bottom: 15px;
    }

    .closed-day {
        color: grey;
        font-weight: bold;
    }

    .admin-cancel {
        background-color: #ff6b6b;
        font-size: x-small;
    }

    .admin-cancel:hover {
        background-color: #ff4c4c;
    }

    :global(body.dark-mode) .booking-container {
        background-color: #272936;
        color: #bfc2c7;
    }

    :global(body.dark-mode) .date-row {
        background-color: #1b1c23;
        color: #bfc2c7;
        border-bottom: 1px solid #bfc2c7;
    }

    :global(body.dark-mode) .shift-info {
        color: #bfc2c7;
    }

    :global(body.dark-mode) .booking-entry {
        background-color: #333;
        color: #bfc2c7;
    }

    :global(body.dark-mode) .week-number {
        background-color: #1b1c23;
        color: #bfc2c7;
    }
</style>
