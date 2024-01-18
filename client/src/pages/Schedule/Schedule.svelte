<script>
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import { user } from '../../stores/userStore';
    import io from 'socket.io-client';
    import ConfirmationModal from '../../component/ConfirmationModal/ConfirmationModal.svelte';
    import { SyncLoader } from 'svelte-loading-spinners';
    import FaBars from 'svelte-icons/fa/FaBars.svelte';
    import BookingModal from '../../component/BookingModal/BookingModal.svelte';

    const socket = io('');

    let bookings = {};
    let userBookings = {};
    let loading = true;
    let closedDays = [];
    let currentUser = $user;
    let showConfirmationModal = false;
    let showBookingModal = false;
    let currentBookingId = null;
    let currentBookingDate = null;
    let currentWaitlist = [];
    let isFullyBookedMorning = false;
    let isFullyBookedAfternoon = false;
    let hasAfternoonBooking = false;
    let hasMorningBooking = false;
    const pageTitle = 'Go Office | Schedule'

    onMount(() => {
        if ($user) {
            document.title = pageTitle;
            fetchClosedDays();
            fetchBookings();
            socket.on('bookingUpdate', fetchBookings);
            socket.on('waitlistUpdate', () => {
                showBookingModal = false;
                openBookingModal(currentBookingDate);
            });
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
            const response = await fetch('/api/bookings/four-weeks');
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
        return Math.ceil((days + 1) / 7);
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
            const response = await fetch('/api/bookings', {
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
            const response = await fetch('/api/bookings', {
                method: 'DELETE',
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
            const response = await fetch('/api/closed-days');

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

    async function fetchWaitlist(date) {
        try {
            const response = await fetch(`/api/waitlist/${date}`);
            if (!response.ok) {
                throw new Error('Error fetching waitlist');
            }
            return await response.json();
        } catch (error) {
            toast.error('Error fetching waitlist: ' + error.message);
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

    async function openBookingModal(date) {
        try {
            const waitlistData = await fetchWaitlist(date);

            isFullyBookedMorning = bookings[date].morning.spotsLeft > 0;
            isFullyBookedAfternoon = bookings[date].afternoon.spotsLeft > 0;

            hasMorningBooking = userBookings[date] && userBookings[date].morning;
            hasAfternoonBooking = userBookings[date] && userBookings[date].afternoon;

            currentBookingDate = date;
            currentWaitlist = waitlistData;

            showBookingModal = true;
        } catch (error) {
            toast.error('Error fetching waitlist: ' + error.message);
        }
    }

    function closeBookingModal() {
        showBookingModal = false;
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

    async function cancelWaitlist(id) {
        try {
            const response = await fetch(`/api/waitlist`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ waitlist_id: id }),
            });
            if (!response.ok) {
                throw new Error('Error canceling waitlist');
            }
            toast.success('Successfully canceled waitlist');
            fetchBookings();
        } catch (error) {
            toast.error('Error canceling waitlist: ' + error.message);
        }
    }

    async function joinWaitlist(date, shiftType) {
        try {
            const response = await fetch(`/api/waitlist`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift_date: date, shift_type: shiftType, user_id: currentUser.user_id }),
            });
            if (!response.ok) {
                throw new Error('Error joining waitlist');
            }
            toast.success('Successfully joined waitlist');
            fetchBookings();
        } catch (error) {
            toast.error('Error joining waitlist: ' + error.message);
        }
    }
</script>

<Toaster />

{#if showConfirmationModal}
    <ConfirmationModal message="Are you sure you want to cancel this booking?" onConfirm={confirmCancellation} onCancel={cancelCancellation} />
{/if}

{#if showBookingModal}
    <BookingModal
        waitlist={currentWaitlist}
        onCancel={closeBookingModal}
        morningBooked={hasMorningBooking}
        afternoonBooked={hasAfternoonBooking}
        user={currentUser}
        onRemoveFromWaitlist={id => cancelWaitlist(id)}
        {isFullyBookedMorning}
        {isFullyBookedAfternoon}
        onMorningJoin={() => joinWaitlist(currentBookingDate, 'morning')}
        onAfternoonJoin={() => joinWaitlist(currentBookingDate, 'afternoon')}
    />
{/if}

{#if loading}
    <SyncLoader size="100" color="#1b1c23" unit="px" />
{:else}
    <div class="booking-container">
        <h1>Desk Bookings</h1>
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
                        <button
                            class="cancel-button"
                            disabled={isDisabled(date)}
                            on:click={() => openConfirmationModal(userBookings[date].afternoon.bookingId)}
                        >
                            Cancel Afternoon
                        </button>
                    {/if}
                    <button class="wait-list" disabled={isDisabled(date)} on:click={() => openBookingModal(date)}>
                        <div class="select-icon">
                            <FaBars />
                            {#if !isDisabled(date)}
                                <div class="tooltip">More</div>
                            {/if}
                        </div>
                    </button>
                {/if}
            </div>
            {#if !isClosedDay(date)}
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
            {/if}
        {/each}
    </div>
{/if}

<style>
    :global(body.dark-mode) .select-icon {
        color: #bfc2c7;
    }
    .select-icon .tooltip {
        visibility: hidden;
        width: 100px;
        background-color: #535bf2;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 8px 0;
        position: absolute;
        margin-left: 45px;
        margin-top: -38px;
        z-index: -1;
        border-color: #333;
    }

    .select-icon:hover {
        transform: scale(1.1);
    }

    .select-icon:hover .tooltip {
        visibility: visible;
    }

    .wait-list {
        background-color: transparent;
        color: #fff;
        border: none;
        cursor: pointer;
        margin: 0px;
        transition: background-color 0.2s;
    }

    .select-icon {
        width: 30px;
        height: 30px;
        color: #1b1c23;
        display: block;
        text-decoration: none;
    }
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
        background-color: #1e1f27;
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
