import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import axios from 'axios';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Brevo API key from environment variables
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Create Axios instance for Brevo API
const brevoAPI = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'Content-Type': 'application/json',
    'api-key': BREVO_API_KEY,
    'Accept': 'application/json'
  }
});

// Function to append logs to a file
async function logToFile(message, isError = false) {
  try {
    const logFile = isError ? 'email_error_log.txt' : 'email_log.txt';
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    
    await fs.appendFile(path.join(__dirname, logFile), logMessage);
    
    // Also log to console
    if (isError) {
      console.error(message);
    } else {
      console.log(message);
    }
  } catch (err) {
    console.error(`Error writing to log file:`, err);
  }
}

// Log request middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Simple route to test the server is running
app.get('/', (req, res) => {
  res.send('Email notification server is running! Send POST requests to /send-order to trigger email notifications.');
});

// Route for sending order notifications
app.post('/send-order', async (req, res) => {
  await logToFile('Received order notification request: ' + JSON.stringify(req.body, null, 2));
  const { name, email, orderDetails } = req.body;
  
  if (!name || !orderDetails) {
    await logToFile('Missing required fields: name or orderDetails', true);
    return res.status(400).json({ error: 'Name and order details are required' });
  }
  
  try {
    await logToFile('Attempting to send email via Brevo API...');

    // Configure the email payload for direct API call
    const emailPayload = {
      sender: {
        name: "Les Dunes d'Or",
        email: "quikasalami@gmail.com"
      },
      to: [{
        email: "quikasalami@gmail.com",
        name: "Admin"
      }],
      replyTo: {
        email: "quikasalami@gmail.com",
        name: "Les Dunes d'Or"
      },
      subject: `📦 NOUVELLE COMMANDE - Les Dunes d'Or #${new Date().getTime()}`,
      htmlContent: `
        <h2>Nouvelle Commande Reçue</h2>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email || 'Non fourni'}</p>
        <p><strong>Détails:</strong></p>
        <div>${orderDetails}</div>
        <p><strong>Téléphone:</strong> <a href="tel:+21658678330">+216 58 678 330</a></p>
        <p><strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=61579136484387">Les Dunes d'Or Facebook</a></p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      textContent: `Nouvelle Commande

Nom: ${name}
Email: ${email || 'Non fourni'}

Détails de la commande:
${orderDetails.replace(/<[^>]*>?/gm, '')}

Téléphone: +216 58 678 330

Facebook: https://www.facebook.com/profile.php?id=61579136484387

Timestamp: ${new Date().toISOString()}`
    };
    
    await logToFile('Sending email using Brevo API with payload: ' + JSON.stringify(emailPayload, null, 2));
    
    // Send the email using direct API call
    try {
      const response = await brevoAPI.post('/smtp/email', emailPayload);
      await logToFile('Email sent successfully: ' + JSON.stringify(response.data));
      
      // Return success to the client
      res.status(200).json({
        message: 'Order notification email sent successfully',
        messageId: response.data.messageId
      });
    } catch (apiError) {
      const errorDetails = apiError.response?.data 
        ? JSON.stringify(apiError.response.data) 
        : apiError.message;
      
      await logToFile('Error from Brevo API: ' + errorDetails, true);
      
      // Check for specific API key issues
      if (apiError.response?.status === 401) {
        await logToFile('API KEY AUTHENTICATION FAILED - Please check your Brevo API key', true);
      } else if (apiError.response?.status === 403) {
        await logToFile('API KEY PERMISSION DENIED - Your API key may not have email sending permissions', true);
      }
      
      res.status(500).json({
        error: 'Failed to send email notification',
        details: errorDetails
      });
    }
  } catch (error) {
    await logToFile('Error preparing email: ' + error.message, true);
    res.status(500).json({
      error: 'Failed to prepare email notification',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Test ping route
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// Test route to verify API key
app.get('/test-api-key', async (req, res) => {
  if (BREVO_API_KEY) {
    const maskedKey = BREVO_API_KEY.substring(0, 5) + '...' + 
                      BREVO_API_KEY.substring(BREVO_API_KEY.length - 5);
    
    try {
      // Verify API key by making a simple GET request to Brevo API
      const response = await brevoAPI.get('/account');
      res.send(`
        <h3>Brevo API Key Status</h3>
        <p>API key is configured and working properly!</p>
        <p>Masked key: ${maskedKey}</p>
        <p>Key length: ${BREVO_API_KEY.length} characters</p>
        <p>Account info: ${JSON.stringify(response.data)}</p>
        <p><a href="/test-email">Send a test email</a></p>
      `);
    } catch (error) {
      const errorDetails = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : error.message;
      
      res.status(401).send(`
        <h3>Brevo API Key Error</h3>
        <p>API key is configured but not working!</p>
        <p>Masked key: ${maskedKey}</p>
        <p>Key length: ${BREVO_API_KEY.length} characters</p>
        <p>Error: ${errorDetails}</p>
      `);
    }
  } else {
    res.status(500).send('API key is not configured in environment variables!');
  }
});

// Test route to send a test email
app.get('/test-email', async (req, res) => {
  try {
    await logToFile('Sending test email via Brevo API');
    
    const emailPayload = {
      sender: {
        name: "Les Dunes d'Or",
        email: "quikasalami@gmail.com"
      },
      to: [{
        email: "quikasalami@gmail.com",
        name: "Admin Test"
      }],
      cc: [{
        email: "quikasalami@gmail.com",
        name: "Les Dunes d'Or"
      }],
      subject: `🧪 TEST EMAIL - Les Dunes d'Or ${new Date().toISOString()}`,
      htmlContent: `
        <h2>Email de Test</h2>
        <p>Ceci est un email de test pour vérifier la configuration de Brevo.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p><strong>Téléphone:</strong> <a href="tel:+21658678330">+216 58 678 330</a></p>
        <p><strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=61579136484387">Les Dunes d'Or Facebook</a></p>
      `,
      textContent: `Email de Test\n\nCeci est un email de test pour vérifier la configuration de Brevo.\n\nTimestamp: ${new Date().toISOString()}\n\nTéléphone: +216 58 678 330\n\nFacebook: https://www.facebook.com/profile.php?id=61579136484387`
    };
    
    await logToFile('Sending test email with payload: ' + JSON.stringify(emailPayload, null, 2));
    
    // Send the email using direct API call
    const response = await brevoAPI.post('/smtp/email', emailPayload);
    
    await logToFile('Test email sent successfully: ' + JSON.stringify(response.data));
    res.status(200).json({ 
      message: 'Test email sent successfully', 
      messageId: response.data.messageId 
    });
  } catch (error) {
    const errorDetails = error.response?.data 
      ? JSON.stringify(error.response.data) 
      : error.message;
      
    await logToFile('Error sending test email: ' + errorDetails, true);
    res.status(500).json({
      error: 'Failed to send test email',
      details: errorDetails
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${BREVO_API_KEY ? 'YES' : 'NO'}`);
  
  // Log some diagnostic information
  if (BREVO_API_KEY) {
    console.log(`API Key length: ${BREVO_API_KEY.length} characters`);
    console.log(`First 5 chars: ${BREVO_API_KEY.substring(0, 5)}...`);
    console.log(`Available routes:`);
    console.log(`- GET  / : Server status`);
    console.log(`- GET  /test-api-key : Check API key validity`);
    console.log(`- GET  /test-email : Send a test email`);
    console.log(`- POST /send-order : Send an order notification email`);
  } else {
    console.log('WARNING: BREVO_API_KEY is not set in environment variables!');
  }
});
