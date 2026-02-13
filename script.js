// Shared Logic: Mobile Menu
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const btn = document.querySelector('button.md\\:hidden');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        btn.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('shadow-lg', 'bg-brand-dark/90');
            navbar.classList.remove('glass');
        } else {
            navbar.classList.remove('shadow-lg', 'bg-brand-dark/90');
            navbar.classList.add('glass');
        }
    });

    // Stats Counter Animation (Only on Home Page)
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const speed = 200; // The lower the slower

        const animateCounters = () => {
            counters.forEach(counter => {
                const updateCount = () => {
                    const target = +counter.getAttribute('data-target');
                    const count = +counter.innerText.replace('+', '').replace('%', ''); // remove + or % for calculation

                    // Lower inc to slow and higher to slow
                    const inc = target / speed;

                    if (count < target) {
                        // Add inc to count and output in counter
                        let nextCount = Math.ceil(count + inc);
                        if (counter.innerText.includes('%')) {
                            counter.innerText = nextCount + "%";
                        } else {
                            counter.innerText = nextCount + "+";
                        }
                        setTimeout(updateCount, 20);
                    } else {
                        if (counter.innerText.includes('%')) {
                            counter.innerText = target + "%";
                        } else {
                            counter.innerText = target + "+";
                        }
                    }
                };
                updateCount();
            });
        };

        // Trigger animation when in view
        let observed = false;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !observed) {
                    animateCounters();
                    observed = true;
                }
            });
        });

        observer.observe(document.querySelector('.counter').parentElement.parentElement.parentElement);
    }
});

// Booking Logic
const SLOTS = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];

function loadSlots(dateStr) {
    const container = document.getElementById('slots-container');
    const displayDate = document.getElementById('selected-date-display');

    if (!container) return; // Not on booking page

    // Update display text
    const dateObj = new Date(dateStr);
    displayDate.innerText = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Show loading
    container.innerHTML = '<div class="col-span-full text-center py-10 text-brand-cyan"><i class="fas fa-circle-notch fa-spin text-3xl"></i></div>';

    setTimeout(() => {
        container.innerHTML = '';

        // Retrieve existing bookings for this date
        const bookings = JSON.parse(localStorage.getItem('infinity_bookings') || '{}');
        const bookedSlots = bookings[dateStr] || [];

        SLOTS.forEach((time, index) => {
            const isBooked = bookedSlots.some(b => b.slotId === index);

            const slotCard = document.createElement('div');
            slotCard.className = `glass p-4 rounded-xl border border-gray-700 transition-all duration-300 transform hover:scale-105 ${isBooked ? 'opacity-50 cursor-not-allowed border-red-900 bg-red-900/10' : 'hover:border-brand-cyan hover:shadow-[0_0_15px_rgba(102,252,241,0.2)] cursor-pointer'}`;

            if (!isBooked) {
                slotCard.onclick = () => openBookingModal(dateStr, index, time);
            }

            slotCard.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 rounded-lg ${isBooked ? 'bg-red-900/20 text-red-500' : 'bg-brand-cyan/10 text-brand-cyan'}">
                            <i class="far fa-clock text-xl"></i>
                        </div>
                        <div>
                            <span class="block text-lg font-bold text-white">${time}</span>
                            <span class="text-xs ${isBooked ? 'text-red-400' : 'text-green-400'} uppercase font-bold tracking-wider">${isBooked ? 'Booked' : 'Available'}</span>
                        </div>
                    </div>
                    ${!isBooked ? '<i class="fas fa-chevron-right text-gray-500"></i>' : '<i class="fas fa-lock text-red-500"></i>'}
                </div>
            `;
            container.appendChild(slotCard);
        });
    }, 500); // Simulate network delay
}

let currentBookingContext = null;

function openBookingModal(date, slotId, time) {
    currentBookingContext = { date, slotId, time };

    const modal = document.getElementById('booking-modal');
    const title = document.getElementById('modal-slot-info');

    // Reset form
    document.getElementById('booking-form').reset();

    // Set info
    title.innerText = `Date: ${date} | Time: ${time}`;

    // Show modal
    modal.classList.remove('hidden');
    modal.querySelector('.transform').classList.add('animate-fade-in-up');
}

function closeModal() {
    const modal = document.getElementById('booking-modal');
    modal.classList.add('hidden');
    currentBookingContext = null;
}

function submitBooking() {
    if (!currentBookingContext) return;

    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const vehicle = document.getElementById('vehicle').value;

    if (!name || !phone || !vehicle) {
        alert("Please fill in all fields.");
        return;
    }

    // Show loading state in button
    const submitBtn = document.querySelector('#booking-modal button[onclick="submitBooking()"]');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Processing...";
    submitBtn.disabled = true;

    // Save to LocalStorage
    const { date, slotId, time } = currentBookingContext;
    const bookings = JSON.parse(localStorage.getItem('infinity_bookings') || '{}');

    if (!bookings[date]) {
        bookings[date] = [];
    }

    // Prepare booking data
    const bookingData = {
        slotId,
        time,
        customerName: name,
        phone,
        vehicle,
        bookedAt: new Date().toISOString()
    };

    bookings[date].push(bookingData);
    localStorage.setItem('infinity_bookings', JSON.stringify(bookings));

    // Send Email using EmailJS
    // Service ID: default_service (or your specific service ID)
    // Template ID: Create a template in EmailJS dashboard
    // Template Params: to_email, customer_name, vehicle, phone, date, time

    const emailParams = {
        to_email: "chamifernando89@gmail.com", // The owner's email
        from_name: name,
        customer_phone: phone,
        vehicle_model: vehicle,
        booking_date: date,
        booking_time: time
    };

    // NOTE: Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values from EmailJS
    emailjs.send("service_bb728pi", "template_yrsnfzw", emailParams)
        .then(function (response) {
            console.log('SUCCESS!', response.status, response.text);
            showToast(`Appointment Confirmed! Email sent to Admin.`);
        }, function (error) {
            console.log('FAILED...', error);
            showToast(`Appointment Confirmed locally (Email failed: Check Console)`);
        })
        .finally(() => {
            // Close and refresh
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            closeModal();
            loadSlots(date);
        });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');

    msg.innerText = message;

    // Remove translate-y-20 and opacity-0 to visual show
    toast.classList.remove('translate-y-20', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 4000);
}
