# Oscar Nominations Database System

A web application for tracking Oscar nominations and winners with MySQL database integration.

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- MySQL database access

## Database Setup

This application connects to a MySQL database with the following configuration:
- Host: db4free.net
- User: mmaakh
- Password: 1234567890
- Database: oscardb
- Port: 3306

The database is pre-populated with Oscar data for demonstration purposes.

## Installation Steps

1. Clone the repository
   ```
   git clone https://github.com/mostafa0001-me/DB_Project/
   cd DB_Project
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the application
   ```
   npm start
   ```

4. Access the application
   Open your browser and navigate to: `http://localhost:5000`

## Features

### User Authentication
- Register with username, password, email, birthdate, gender, and country
- Login to access the system features

### Dashboard
- View overall statistics including total nominations, Oscar winners, and user nominations
- See recent user nominations and top categories

### My Nominations
- View your submitted nominations
- Add new nominations for different categories
- Delete nominations you've created

### Statistics
- **Top Nominated Movies**: Browse movies with the most user nominations
- **Staff Oscar Stats**: View directors, actors, and other staff members with their nominations and wins
- **Birth Countries**: Explore the top birth countries for Oscar-winning actors/actresses
- **Staff by Country**: Filter staff members by their country of birth
- **Dream Team**: See the "Dream Team" of living professionals with the most Oscar wins
- **Top Production Companies**: View studios with the most Academy Award wins
- **Non-English Winners**: Explore Oscar-winning films in languages other than English

## Database Schema

The system uses the following tables:
- Movie (Name, Release_Date, Runtime, Language, PD_company)
- Person (PName, Date_of_Birth, Country_of_Birth, Death_Date)
- Nomination (Category, Iteration, Movie_Name, Movie_Release_Date, Person_Name, Person_Date_of_Birth, Won)
- User (Username, Birthdate, Email_Address, Gender, Country)
- USR_Nomination (Category, Iteration, User_Username, Movie_Name, Movie_Release_Date, Person_Name, Person_Date_of_Birth)
- Belong (Movie_Name, Movie_Release_Date, Person_Name, Person_Date_of_Birth, Role)

## Tech Stack

- **Frontend**: React, TailwindCSS, ShadcnUI
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: Passport.js with session-based auth
- **State Management**: React Query

## Troubleshooting

- **Date Format Issues**: The application handles dates in YYYY-MM-DD format. If you encounter foreign key constraint errors when adding or deleting nominations, it may be due to date format inconsistencies between your system and the database.
- **Login Problems**: Ensure you're using the correct username and password. The system is case-sensitive.
- **Connection Issues**: If you cannot connect to the database, verify your internet connection as the database is hosted on db4free.net.

## Project Structure

- `client/`: React frontend application
- `server/`: Node.js backend API
- `shared/`: Common code shared between client and server (schemas, types)

## Developer Notes

This project was developed as part of a database course to demonstrate practical database design and implementation skills.
