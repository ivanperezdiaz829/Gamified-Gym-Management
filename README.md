# Gamified Gym Management

<p align="center">
  <img src="https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
</p>

A modern, interactive, and gamified web application for managing gym memberships, tracking fitness progress, and engaging members through a reward-based system. Built with **Angular** and powered by **Firebase**.

## About The Project 📖

Traditional gym management systems only focus on administrative tasks. **Gamified Gym Management** bridges the gap between gym administrators and members by introducing gamification. It allows staff to seamlessly manage memberships and classes, while members can earn points, unlock achievements, and compete on leaderboards for checking in, completing workouts, and reaching their fitness goals.

## Key Features

### For Members:
* **Gamification Engine:** Earn points and badges for gym attendance, class participation, and fitness milestones.
* **Leaderboards:** Friendly competition among members based on weekly/monthly activity points.
* **Class Booking:** View the gym schedule and reserve spots in fitness classes.
* **Progress Tracking:** Monitor workout history and overall fitness progress.

### For Administrators:
* **Member Management:** Add, edit, or remove members and track subscription statuses.
* **Subscription Tracking:** Easily monitor active, expiring, and overdue memberships.
* **Role-Based Access:** Secure authentication using Firebase to separate standard users from gym staff.

## Tech Stack 🛠️

* **Frontend:** [Angular](https://angular.dev/) (v21+), TypeScript, HTML5, CSS3
* **Backend & Database:** [Firebase](https://firebase.google.com/) (Firestore, Firebase Authentication)
* **Testing:** [Vitest](https://vitest.dev/)

## Getting Started 🚀 

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.x or later)
* [Angular CLI](https://github.com/angular/angular-cli) (`npm install -g @angular/cli`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/ivanperezdiaz829/Gamified-Gym-Management.git](https://github.com/ivanperezdiaz829/Gamified-Gym-Management.git)
   cd Gamified-Gym-Management
   ```
   
2. **Install dependencies:**
   ```bash
   npm install
   ```
   
3. **Firebase SetUp:**
  Please refer to the FIREBASE_SETUP.md file included in this repository for detailed instructions on configuring your Firebase environment variables and connecting the application to your   database.

4. **Launch the development server:**
   ```bash
   ng serve
   ```
  Navigate to http://localhost:4200 in yout browser to use the webapp.

The application will automatically reload if you change any source file.
