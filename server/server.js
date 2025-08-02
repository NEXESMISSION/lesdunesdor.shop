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
app.use(express.json());

// Configure CORS for both development and production
const allowedOrigins = [
  'http://localhost:3000',
  'https://www.meublesdor.shop',
  'https://meublesdor.shop',
  'https://lesdunesdor.shop',
  'https://www.lesdunesdor.shop'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`CORS request from unauthorized origin: ${origin}`);
      // Still allow during testing/debugging
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

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

// Helper function to log messages to file with enhanced details for production debugging
async function logToFile(message, details = null) {
  try {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${message}\n`;
    
    // Add detailed info for debugging if provided
    if (details) {
      if (typeof details === 'object') {
        try {
          logMessage += `DETAILS: ${JSON.stringify(details, null, 2)}\n`;
        } catch (e) {
          logMessage += `DETAILS: [Object could not be stringified]\n`;
        }
      } else {
        logMessage += `DETAILS: ${details}\n`;
      }
    }
    
    // Add environment info to help debug production issues
    logMessage += `ENV: ${process.env.NODE_ENV || 'development'}\n`;
    logMessage += `API_KEY_LENGTH: ${BREVO_API_KEY ? BREVO_API_KEY.length : 0}\n`;
    logMessage += `---------------\n`;
    
    await fs.appendFile(path.join(__dirname, 'email_log.txt'), logMessage);
    console.log(logMessage.trim());
    
    return true;
  } catch (error) {
    console.error('Error writing to log file:', error);
    return false;
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
  const { name, email, orderDetails } = req.body;
  
  // Log incoming request for debugging
  await logToFile(`Received order notification request from origin: ${req.headers.origin || 'unknown'}`, {
    body: req.body,
    headers: req.headers
  });
  
  // Validate required fields
  if (!name || !orderDetails) {
    await logToFile(`Order notification request missing required fields`, req.body);
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Verify API key before attempting to send
    if (!BREVO_API_KEY) {
      await logToFile('CRITICAL ERROR: Missing Brevo API key in environment variables');
      return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }
    
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
      textContent: `
        NOUVELLE COMMANDE - Les Dunes d'Or
        Nom: ${name}
        Email: ${email || 'Non fourni'}
        Détails: ${orderDetails.replace(/<[^>]*>?/gm, '')}
        Téléphone: +216 58 678 330
        Facebook: https://www.facebook.com/profile.php?id=61579136484387
      `
    };

    await logToFile('Sending email with payload', {
      to: emailPayload.to,
      subject: emailPayload.subject,
      apiKeyLength: BREVO_API_KEY.length
    });
    
    // Send the email using Brevo API
    const response = await brevoAPI.post('/smtp/email', emailPayload);
    
    // Log success with message ID
    await logToFile(`Email sent successfully`, response.data);
    
    res.status(200).json({ 
      success: true, 
      messageId: response.data.messageId || 'unknown',
      message: 'Email notification sent successfully'
    });
    
  } catch (apiError) {
    // Extract and log detailed error information
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    if (apiError.response) {
      errorDetails = apiError.response.data;
      statusCode = apiError.response.status;
      await logToFile(`API Error Response (${statusCode})`, errorDetails);
    } else if (apiError.request) {
      errorDetails = 'No response received from API';
      await logToFile('API Request Error - No response received', apiError.request);
    } else {
      errorDetails = apiError.message;
      await logToFile('API Request Setup Error', errorDetails);
    }
    
    res.status(statusCode).json({
      success: false,
      error: 'Failed to send email notification',
      details: errorDetails
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
