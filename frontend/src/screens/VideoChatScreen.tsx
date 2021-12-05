import { useState } from 'react';
import styled from 'styled-components';
import { CallButton } from '../components/CallButton';

import { WebcamButton } from '../components/WebcamButton';
import { WebcamVideo } from '../components/WebcamVideo';
import { firestore } from '../firebase';

const Title = styled.h1``;

export const VideoChatScreen = () => {
  const [localStream, setLocalStream] = useState<any>(null);

  const servers = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
    iceCandidatePoolSize: 10,
  };

  const pc = new RTCPeerConnection(servers);
  const remoteStream = new MediaStream();

  console.log('VIDEOCHATSCREEN');

  const handleWebcamOnClick = async () => {
    console.log('HIT!!', await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));
    const videoAudioStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(videoAudioStream);

    if (!localStream) return;
    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };
  };

  const handleCallOnClick = async () => {
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    /* callInput.value = callDoc.id;

    // Get candidates for caller, save to db
    pc.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    // Listen for remote ICE candidates
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    }); */
  };

  return (
    <>
      <Title>1. Start your Webcam</Title>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <WebcamVideo srcObject={localStream} />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video id="remoteVideo" autoPlay playsInline></video>
        </span>
      </div>
      <WebcamButton onClick={handleWebcamOnClick} />

      <Title>2. Create a new Call</Title>
      <CallButton onClick={handleCallOnClick} />

      <Title>3. Join a Call</Title>
      <p>Answer the call from a different browser window or device</p>
      <input id="callInput" />
      <button id="answerButton" disabled>
        Answer
      </button>

      <Title>4. Hangup</Title>
      <button id="hangupButton" disabled>
        Hangup
      </button>
      <script type="module" src="/main.js"></script>
    </>
  );
};
