# Mind Track (SRAD26 Group 3)

Mind Track is a wellbeing companion app for Reykjavik University students, staff, and therapists. It supports mood check-ins, workshop participation, and therapist availability workflows.

## Features

- Mood check-ins and weekly trends
- Workshop browsing, joining, and hosting
- Therapist availability and appointment management
- Role-based dashboards (student/employee/therapist)

## Tech Stack

- Expo + React Native
- TypeScript
- AsyncStorage for local persistence
- Expo Router for navigation

## Setup

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npx expo start
```

## Tests

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Tests live in `tests/` and focus on domain/context logic.

## Tested Functionalities

1. Authentication: register, login, logout, and invalid input handling
2. Appointments: default load behavior
3. Availability: add/remove slots and marked dates
4. Workshops: load defaults, create/remove, and capacity limits
5. Available appointments: slots provided via context

## Untested Areas

- UI screens and navigation flows (require UI/integration tests)
- Expo Router navigation transitions
- Visual layout and styling

## Notes

The project targets local/demo use and persists data on-device with AsyncStorage.
