import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AnswerButton } from '../components/AnswerButton';
import { CallButton } from '../components/CallButton';

import { WebcamButton } from '../components/WebcamButton';
import { WebcamVideo } from '../components/WebcamVideo';
import { firestore } from '../firebase';

const Title = styled.h1``;

export const VideoChatScreen = () => {
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(new MediaStream());
  const [callInput, setCallInput] = useState<any>(null);

  const servers = useMemo(
    () => ({
      iceServers: [
        {
          urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
      ],
      iceCandidatePoolSize: 10,
    }),
    [],
  );

  const pc = useMemo(() => new RTCPeerConnection(servers), [servers]);

  useEffect(() => {
    if (!localStream) return;
    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track: any) => {
      pc.addTrack(track, localStream);
    });
    // Pull tracks from remote stream, add to video stream
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        const tempRemoteStream = remoteStream;
        tempRemoteStream.addTrack(track);
        setRemoteStream(tempRemoteStream);
      });
    };
  }, [localStream, pc, remoteStream]);

  const handleWebcamOnClick = async () => {
    const videoAudioStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    setLocalStream(videoAudioStream);
  };

  const handleCallOnClick = async () => {
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    setCallInput(callDoc.id);

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
    });
  };

  const handleAnswerOnClick = async () => {
    const callId = callInput;
    if (!callId) return;
    const callDoc = firestore.collection('calls').doc(callId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    // Fetch data, then set the offer & answer
    const callData = (await callDoc.get()).data();
    if (!callData) return;

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    // Listen to offer candidates
    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  return (
    <>
      <Title>1. Start your Webcam</Title>
      <WebcamButton onClick={handleWebcamOnClick} />
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <WebcamVideo srcObject={localStream} id="webcamVideo" />
        </span>
        <span>
          <h3>Remote Stream</h3>
          <WebcamVideo srcObject={remoteStream} id="remoteVideo" />
        </span>
      </div>

      <Title>2. Create a new Call</Title>
      <CallButton onClick={handleCallOnClick} />

      <Title>3. Join a Call</Title>
      <p>Answer the call from a different browser window or device</p>
      <input
        id="callInput"
        value={callInput ?? ''}
        onChange={(event) => setCallInput(event.target.value)}
        style={{ color: 'black', display: 'block', width: 200 }}
      />
      <AnswerButton onClick={handleAnswerOnClick} />

      <Title>4. Hangup</Title>
      <button id="hangupButton" disabled>
        Hangup
      </button>
      <script type="module" src="/main.js"></script>
    </>
  );
};
