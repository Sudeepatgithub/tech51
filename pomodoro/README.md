
# Static Pomodoro Timer

A simple, browser-based Pomodoro timer running on vanilla HTML/CSS/JS.

## How to Run

1.  Clone or download the project folder.
2.  Open `index.html` in your web browser.
3.  That's it!

## Features

-   **Timers**: Configurable Pomodoro (25m), Short Break (5m), and Long Break (15m).
-   **Cycle Logic**: Automatically tracks Pomodoros and suggests Short or Long breaks (default: 4 Pomodoros = Long Break).
-   **Settings**: Customize timer durations, auto-start, and notification preferences. Persists to browser `localStorage`.
-   **Audio**: Plays a gentle tone when a timer completes (using Web Audio API).
-   **Theme**: Dark/Light mode toggle (saved in settings).
-   **Accuracy**: Uses system time delta checks to prevent timer drift when tab is inactive.

## localStorage Keys

-   `pomodoroSettings`: Stores user configuration (durations, theme, toggles).
-   `pomodoroStats`: Stores the number of completed Pomodoros.

## Limitations

-   Audio requires user interaction (click anywhere on page) first before the browser allows it to play. The "Start" button serves this purpose.
-   Desktop notifications require browser permission approval.
