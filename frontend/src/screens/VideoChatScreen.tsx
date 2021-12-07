import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { AnswerButton } from '../components/AnswerButton';
import { CallButton } from '../components/CallButton';
import { WebcamButton } from '../components/WebcamButton';
import { WebcamVideo } from '../components/WebcamVideo';
import { firestore } from '../firebase';
import waitingForWebcam from '../assets/waitingForUser2.png';
import waitingForFriend from '../assets/waitingForUser3.png';
import { Instructions } from '../components/Instructions';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const Title = styled.h1``;

const Subtitle = styled.h3`
  display: flex;
  justify-content: center;
`;

const VideoContainer = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fit, minmax(240px, 2fr));
  grid-gap: 1rem;
`;

export const VideoChatScreen = () => {
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(new MediaStream());
  const [callInput, setCallInput] = useState<any>(null);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState<boolean>(true);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);

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

  const activateWebcam = async () => {
    try {
      const videoAudioStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(videoAudioStream);
    } catch {
      console.log('Webcam was not found for device.');
      setIsWebcamAvailable(false);
    }
  };

  const startCall = async () => {
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
        setIsCallActive(true);
      });
    });
  };

  const answerCall = async () => {
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
        setIsCallActive(true);
      });
    });
  };

  return (
    <Container>
      <Instructions
        activateWebcam={activateWebcam}
        startCall={startCall}
        answerCall={answerCall}
        callInput={callInput}
        setCallInput={setCallInput}
        localStream={localStream}
        remoteStream={remoteStream}
        isCallActive={isCallActive}
        setIsCallActive={setIsCallActive}
      />

      <VideoContainer className="videos">
        <Container>
          <Subtitle>Friend</Subtitle>

          {remoteStream?.active ? (
            <WebcamVideo srcObject={remoteStream} id="remoteVideo" />
          ) : (
            <img src={waitingForFriend} alt={'Waiting for friend..'} width={240} />
          )}
        </Container>
        <Container>
          <Subtitle>You</Subtitle>
          {localStream ? (
            <WebcamVideo srcObject={localStream} id="webcamVideo" />
          ) : (
            <img src={waitingForWebcam} alt={'Waiting for webcam..'} width={240} />
          )}
        </Container>
      </VideoContainer>
    </Container>
  );
};
