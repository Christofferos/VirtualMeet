# VirtualMeet

_A low-latency video calling application_

<p float="left">
  <img src="branding/previwImgVirtualMeet1.png" width="100" />
  <img src="branding/previwImgVirtualMeet2.png" width="100" /> 
  <img src="branding/previwImgVirtualMeet3.png" width="100" /> 
  <img src="branding/previwImgBattleTronics4.png" width="240" /> 
</p>

Try it out live (use two devices):
https://virtualmeetrtc.herokuapp.com/

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

## TODO LIST:

- Scale down video if device width is smaller than output video ✅
- Allow for more than 2 people to join the call
- Talk | Virtual Meet | Play ✅
- Center formatting and other design ✅
- Challenge someone that is online to play with
- Add timer to environment events
- Publish on Heroku ✅
- Idea: What is the object? Recognition (https://www.youtube.com/watch?v=01sAkU_NvOY)
  (https://data-flair.training/blogs/data-science-project-ideas/)

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

**Firebase:** will work as a 3rd party server is required for signaling that stores shared data for
stream negotiation
