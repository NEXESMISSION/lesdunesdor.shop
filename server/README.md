# Les Dunes d'Or Email Notification Service

This backend service handles email notifications for new orders using Brevo's API.

## Setup Instructions

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   BREVO_API_KEY=your_brevo_api_key_here
   ```

4. Start the server:
   ```
   npm start
   ```

The server will run on http://localhost:3001

## API Endpoints

- `POST /send-order`: Sends an email notification for a new order
  - Required body parameters: 
    - name: Customer's name
    - email: Customer's email
    - orderDetails: HTML content with order details

- `GET /health`: Health check endpoint

## Security Notes

- The API key is stored in the `.env` file and not exposed to the frontend
- Only install this on a secure server with HTTPS in production
- Consider adding rate limiting for additional security
