# UniLife Dashboard FE

Admin dashboard for UniLife project with matching design system from Client FE.

## Features

- ✅ React 18 + Vite build tool
- ✅ Ant Design UI components with custom theme
- ✅ React Router v6 for navigation
- ✅ Zustand for state management
- ✅ Axios for API calls with interceptors
- ✅ Protected routes with authentication
- ✅ Matching color scheme from UniLife Client FE
- ✅ Brand logo integration

## Color System

Uses the same color tokens as Client FE:

- **Primary**: `#ff5532` (Orange)
- **Success**: `#2e7d32` (Green)
- **Warning**: `#ffb80e` (Yellow)
- **Danger**: `#872822` (Red)
- **Info**: `#1976d2` (Blue)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will run on [http://localhost:5174](http://localhost:5174)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=UniLife Dashboard
```

## Default Login Credentials

The login page currently uses mock authentication. Use any email/password to login.

**Note**: Replace mock authentication with actual API calls to UniLife_BE.

## Tech Stack

- **React** 18.3.1
- **Vite** 7.3.1
- **Ant Design** 5.23.2
- **React Router** 7.1.3
- **Zustand** 5.0.2
- **Axios** 1.7.9


The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
