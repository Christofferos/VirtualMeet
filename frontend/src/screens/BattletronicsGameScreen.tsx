import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import adapter from 'webrtc-adapter';

import { firestore } from '../firebase';
import { Spacer } from '../components/Spacer';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Input } from '../components/Input';

const Title = styled.h1``;
const Subtitle = styled.h3`
  display: flex;
  justify-content: center;
  text-align: center;
`;

const GAMES_COLLECTION_KEY = 'games';
const OFFER_CANDIDATES_KEY = 'offerCandidates';
const ANSWER_CANDIDATES_KEY = 'answerCandidates';

const makeId = (length: number) => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const BattletronicsGameScreen = () => {
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [gameInput, setGameInput] = useState<string>('');

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
  const peerConnection = useMemo(() => new RTCPeerConnection(servers), [servers]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const remoteConnection = new RTCPeerConnection();
  remoteConnection.ondatachannel = (data: any) => {
    console.log('HIT?', data);
  };

  const createGame = async () => {
    // Reference Firestore collections for signaling
    const gameCode = makeId(3);
    console.log('GAMECODE: ', gameCode);
    /* setCallInput(gameDoc.id);
    setIsCreateCallModalActive(true); */
    const gameDoc = firestore.collection(GAMES_COLLECTION_KEY).doc(gameCode);
    const offerCandidates = gameDoc.collection(OFFER_CANDIDATES_KEY);
    const answerCandidates = gameDoc.collection(ANSWER_CANDIDATES_KEY);
    // Get candidates for caller, save to db
    peerConnection.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };
    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    await gameDoc.set({ offer, id: gameCode });
    // Listen for remote answer
    gameDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
      }
    });
    // Listen for remote ICE candidates
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
        setIsGameActive(true);
      });
    });
    setDataChannel(peerConnection.createDataChannel('Battletronics-code123'));
  };

  const joinGame = async () => {
    if (!gameInput) return;
    const callDoc = firestore.collection(GAMES_COLLECTION_KEY).doc(gameInput);
    const offerCandidates = callDoc.collection(OFFER_CANDIDATES_KEY);
    const answerCandidates = callDoc.collection(ANSWER_CANDIDATES_KEY);
    peerConnection.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };
    // Fetch data, then set the offer & answer
    const callData = (await callDoc.get()).data();
    if (!callData) return;
    const offerDescription = callData.offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);
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
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
        setIsGameActive(true);
      });
    });
    setDataChannel(peerConnection.createDataChannel('Battletronics-code123'));
  };

  // ----------------------------------------------------------------
  useEffect(() => {
    if (!dataChannel) return;
    console.log('CHANGE MADE TO PEERCONNECTION', dataChannel);
    // Establish your peer connection using your signaling channel here
    dataChannel.onerror = (error: any) => {
      console.log('Data Channel Error:', error);
    };
    dataChannel.onclose = () => {
      console.log('The Data Channel is Closed');
    };
    dataChannel.onmessage = (event: any) => {
      console.log('Got Data Channel Message:', event.data);
    };
    dataChannel.onopen = () => {
      console.log('HITHIT');
      const gameState = {
        message: 'GAME ONGOING',
        timestamp: new Date(),
        movementData: {
          up: false,
          right: true,
        },
      };
      // dataChannel.send(JSON.stringify(gameState));
    };
  }, [peerConnection, dataChannel]);
  // ----------------------------------------------------------------

  const messageQueue: string[] = [];
  const sendMessage = (msg: string) => {
    switch (dataChannel?.readyState) {
      case 'connecting':
        console.log('Connection not open; queueing: ' + msg);
        messageQueue.push(msg);
        break;
      case 'open':
        messageQueue.forEach((msg) => {
          const obj = {
            message: msg,
            timestamp: new Date(),
          };
          dataChannel.send(JSON.stringify(obj));
        });
        break;
      case 'closing':
        console.log('Attempted to send message while closing: ' + msg);
        break;
      case 'closed':
        console.log('Error! Attempt to send while connection closed.');
        break;
    }
  };

  return (
    <Container>
      <Title>BATTLETRONICS BRAWL</Title> <Button onClick={createGame}>Create Game</Button>
      <Spacer height={15} />
      <Input
        placeholder="Code..."
        value={gameInput ?? null}
        onChange={(event) => setGameInput(event.target.value)}
      ></Input>
      <Button onClick={joinGame}>Join Game</Button>
      <Subtitle>[Controls]: Arrows to move, G to fire, H to pick up.</Subtitle>
      <Button onClick={() => sendMessage('CHECK HCECK')}>MSG</Button>
    </Container>
  );
};
