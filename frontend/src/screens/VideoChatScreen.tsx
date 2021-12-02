import { useState } from 'react';
import styled from 'styled-components';

import { WebcamButton } from '../components/WebcamButton';
import { WebcamVideo } from '../components/WebcamVideo';

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
  let remoteStream = null;

  console.log('VIDEOCHATSCREEN');

  const handleWebcamOnClick = async () => {
    console.log('HIT!!');
    setLocalStream(await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, localStream);
    });
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
      <button id="callButton" disabled>
        Create Call (offer)
      </button>

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
