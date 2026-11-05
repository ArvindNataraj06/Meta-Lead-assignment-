## System Architecture

The following diagram shows how a new Meta Lead Ads
submission reaches the React Native mobile application.

![System Architecture](docs/architecture.png)



Meta Lead Ads: Real-Time React Native PoC

A proof of concept application that received Meta Lead Ads Submissions and displays them in a React Native App in real time without mannyal screen refresh.

Tech Stack Used

Frontend: React Native, Expo, TypeScript Backend: Node.js, Express Real-time connection: Socket.IO Meta Integration: Meta Webhooks, Graph API Local tunneling: ngrok

Working Explination:

A form is submitted through Meta's Lead Ads Testing Tool
Meta sends a webhook notification to Express Backend
The Express Backend Verifies the webhook signature using the Meta app scret
The backend uses the lead ID and page Access token to retrieve the lead information from Graph API
The lead is stored temporarily in memory and sends to react native app using Socket.io 6.The React Native APp received the event and update its lead list automatically

Setup Backend
cd backend npm install

to Start the Backend: Node server.js

Then Start ngrok in another terminal: ngrok http 3000

Configure the public ngrok callback URL in Meta Developer Dashboard: https://YOUR-NGROK-DOMAIN/webhook then Verify the webhook and subscribe the facebook page to Leadgen events

Setup Frontend
cd Mobile npm install

To start the application : npx expo start then scan the OR code in Expo app

Final
open the screen in React Native App confirm the app is connected to backend Open Meta's Lead Ads testing tool, then select the configured page and instant form submit the form by clicking on [Create Lead] Button Verify that lead appears in the app automatically.

Project Status
The End to End real-time lead delivery workflow has been implemented and tested successfully

Assumptions:

1. A meta Developer App, Facebook page and lead Ads form are already configured with the necessary webhook subscriptions and permissions 
2. The Node.js backend runs locally on port 3000 and ngrok provides a public HTTPS URL for receiving webhool notifications and connectiong the mobile application The forms data are temporarily stored in backend and gets deleted 
3. when we restart the server The Integration is demonstrated using Meta's Lead Ads Testing tool and an already open React Native application, valid meta credentials and an active connection are required.