================================================================================
                        IS3108 Assignment 1 — CineVillage
                     Cinema Management System (ExpressJS)
================================================================================

a. Name
-------
   Chermaine Chua

b. Student Number
-----------------
   A0311796X

c. Database Details & Deployment Instructions
----------------------------------------------
   Database:       MongoDB (via Mongoose ODM)
   Database Name:  cinevillage
   Connection URI: mongodb://localhost:27017/cinevillage

   Prerequisites:
   - Node.js (v18 or above)
   - MongoDB (running locally on default port 27017)

   Steps to deploy:
   1. Open a terminal and navigate to the project folder.
   2. Install dependencies:
        npm install
   3. Ensure MongoDB is running locally (e.g. `mongod` or via MongoDB Compass).
   4. Seed the default admin account:
        node seed.js
      This creates an admin user with:
        Username: admin
        Password: admin123
   5. Start the application:
        node app.js
   6. Open your browser and go to:
        http://localhost:3000
   7. Log in with the admin credentials above.

   Collections (auto-created by Mongoose):
   - staffs      — Admin and staff user accounts
   - chains      — Cinema chain outlets (e.g. GV, Cathay)
   - halls       — Screening halls belonging to chains
   - movies      — Movie catalogue
   - screenings  — Scheduled screenings linking movies to halls

   Dependencies (see package.json):
   - express          — Web framework
   - ejs              — Templating engine
   - mongoose         — MongoDB ODM
   - bcrypt           — Password hashing
   - express-session  — Session management
   - connect-flash    — Flash message notifications

d. Extra Features
-----------------
   1. Admin Dashboard with Analytics
      - Displays real-time statistics: active movies, today's screenings,
        total halls, total chains, total staff, and this week's screening count.
      - Genre breakdown bar chart showing top 6 genres.
      - Chain screening distribution for the next 7 days.
      - Recently added movies list and upcoming screenings timeline.
      - Today's full screening schedule view.

   2. Cinema Chain Management
      - Full CRUD for cinema chains with name, location, contact number,
        email, description, and status (Active / Closed / Coming Soon).
      - Chain detail page showing all halls, upcoming screenings, and
        currently showing movies for a specific chain.
      - Cascade protection: cannot delete a chain that still has halls assigned.
      - Unique chain name validation (duplicate prevention).
      - Hall count display per chain on the list page.

   3. Hall Seat Layout Designer
      - Interactive visual seat layout editor for each hall.
      - Configurable rows and columns (1–30 each).
      - Multiple hall types: Standard, IMAX, VIP, 4DX, Dolby Atmos.
      - Seat type customisation within the layout grid.
      - Gap/aisle support in seating arrangements.
      - Layout auto-regeneration when hall dimensions change.
      - Cascade awareness: warns when editing a hall with future screenings.

   4. Movie–Chain Association
      - Movies can be assigned to one or more cinema chains.
      - Cascade dropdown filtering on the screening form: selecting a movie
        filters available chains, then selecting a chain filters available halls.
      - Deletion protection: cannot delete a movie with future screenings.

   5. Screening Schedule Clash Detection
      - When creating or editing a screening, the system checks for time
        overlaps in the same hall and prevents double-booking.
      - Past-date validation: cannot schedule screenings in the past.
      - Hall status validation: cannot schedule in halls that are
        Under Maintenance or Closed.
      - Auto-calculated end time based on movie duration.
      - Edit/delete protection for currently-showing and completed screenings.

   6. Filtering and Sorting on All List Pages
      - Movie list: filter by genre, language, rating, and chain;
        sort by title, duration, or release date.
      - Hall list: filter by chain, hall type, and status;
        sort by name, type, seat count, or status.
      - Screening list: filter by movie, hall, and status
        (upcoming / showing / completed); sort by date, movie, or hall.
      - Chain list: sorted alphabetically with hall counts.
      - Client-side search input for quick text filtering on tables.

   7. Role-Based Access Control
      - Two roles: admin and staff.
      - Admin-only sections (staff management) are protected by
        dedicated admin middleware.
      - All authenticated routes protected by session-based auth middleware.
      - Admins cannot delete their own account (self-deletion prevention).

   8. Staff Management (Admin Only)
      - Full CRUD for staff accounts with username, role, and active status.
      - Admin can change any staff member's password (with confirmation).
      - Password validation: minimum 6 characters, must match confirmation.
      - Deactivated accounts cannot log in.
      - Duplicate username prevention.

   9. Flash Message Notifications
      - Success and error flash messages displayed across all pages after
        create, update, and delete operations.
      - Consistent user feedback for validation errors and system actions.

  10. Server-Side Validation
      - Comprehensive input validation on all forms (required fields,
        numeric ranges, string trimming, duplicate checks).
      - Graceful error handling with user-friendly messages throughout.