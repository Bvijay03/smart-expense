# Accessing the Prisma Database

To view and edit the database records through a user-friendly web interface, you can use **Prisma Studio**.

## Steps to Open Prisma Studio:

1. Open your terminal.
2. Navigate into the `backend` folder where the Prisma configuration lives:
   ```bash
   cd backend
   ```
3. Run the Prisma Studio command:
   ```bash
   npx prisma studio
   ```
   *(Alternatively, you can run `npm run prisma:studio` if you are using the scripts in `package.json`).*
4. A new tab should automatically open in your default web browser at **http://localhost:5555**. If it doesn't, you can manually click the link or copy and paste it into your browser.

## What You Can Do in Prisma Studio:
- **View Records**: Browse all the tables in your database (e.g., `User`, `Category`, `Transaction`).
- **Edit Data**: Directly modify fields (like editing a transaction amount or a user's name).
- **Delete Records**: Remove test data quickly.
- **Add Records**: Manually insert new data for testing purposes.

> **Note:** Prisma Studio connects to the database specified by the `DATABASE_URL` in your `backend/.env` file. If you are running locally, it will connect to your local PostgreSQL database.
