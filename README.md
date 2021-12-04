# VirtualMeet
*A low-latency video calling application*

## Run the code yourself:

1. Navigate into the backend folder:

   - **cd backend**

2. Run the command:

   - **yarn install && yarn client-install**

3. Start the frontend (client) and backend (server) concurrently:

   - **yarn dev**

## A webRTC video chat app:

- Typescript
- Express
- Signaling Server - Firebase

_Desc_: Firebase will work as a 3rd party server is required for signaling that stores shared data
for stream negotiation

## Deep Dive - Details:

**_Caller_**:

1. Start a webcam feed
2. Create an ‘RTCPeerConnection` connection
3. Call createOffer() and write the offer to the database
4. Listen to the database for an answer
5. Share ICE candidates with other peer
6. Show remote video feed

**_Callee_**:

1. Start a webcam feed
2. Create an ‘RTCPeerConnection` connection
3. Fetch database document with the offer.
4. Call createAnswer(), then write answer to database.
5. Share ICE candidates with other peer
6. Show remote video feed
