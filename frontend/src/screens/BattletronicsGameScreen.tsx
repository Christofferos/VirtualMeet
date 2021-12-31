import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import adapter from 'webrtc-adapter';

import { firestore } from '../firebase';
import { Spacer } from '../components/Spacer';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { ModalOverlay } from '../components/ModalOverlay';
import { Game } from './Game';

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
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [gameInput, setGameInput] = useState<string>('');
  const peerConnection = useMemo(() => new RTCPeerConnection(servers), [servers]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const [isCreateCallModalActive, setIsCreateCallModalActive] = useState<boolean>(false);

  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    if (!dataChannel) return;
    console.log('CHANGE MADE TO PEERCONNECTION', dataChannel);
    dataChannel.onmessage = (event: any) => {
      const parsedData = JSON.parse(event.data);
      // console.log('PARSED DATA ', parsedData, parsedData.gameState);
      // alert('logs');
      if (!parsedData.gameState) return;
      // alert('logs reached');
      setGameState(parsedData.gameState);
    };
    dataChannel.onopen = () => console.log("Receive channel's status has changed to OPEN");
    dataChannel.onclose = () => console.log("Receive channel's status has changed to CLOSE");
    dataChannel.onerror = (error: any) => {
      console.log('Data Channel Error:', error);
    };
    return () => {
      console.log('useEffect teardown');
      // close all the channels
    };
  }, [dataChannel]);

  const createGame = async () => {
    // Reference Firestore collections for signaling
    const gameCode = makeId(3);
    setDataChannel(peerConnection.createDataChannel(`Battletronics-${gameCode}`));
    // console.log('GAMECODE: ', gameCode);
    setGameInput(gameCode);
    setIsCreateCallModalActive(true);
    const gameDoc = firestore.collection(GAMES_COLLECTION_KEY).doc(gameCode);
    const offerCandidates = gameDoc.collection(OFFER_CANDIDATES_KEY);
    const answerCandidates = gameDoc.collection(ANSWER_CANDIDATES_KEY);
    // Get candidates for caller, save to db
    peerConnection.onicecandidate = (event) => {
      console.log('Conn successful (A)');
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
        console.log('set remote description (A)');
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
  };

  const joinGame = async () => {
    if (!gameInput) return;
    peerConnection.ondatachannel = (event: any) => {
      const receiveChannel = event.channel;
      console.log('EVENT CHANNEL ', receiveChannel);
      setDataChannel(receiveChannel);
    };
    const callDoc = firestore.collection(GAMES_COLLECTION_KEY).doc(gameInput);
    const offerCandidates = callDoc.collection(OFFER_CANDIDATES_KEY);
    const answerCandidates = callDoc.collection(ANSWER_CANDIDATES_KEY);
    peerConnection.onicecandidate = (event) => {
      console.log('Conn successful (B)');
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };
    // Fetch data, then set the offer & answer
    const callData = (await callDoc.get()).data();
    if (!callData) return;
    const offerDescription = callData.offer;
    console.log('set remote description (B)');
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
  };

  const closeCreateCallModal = () => {
    setIsCreateCallModalActive(false);
  };

  const messageQueue: string[] = [];
  const sendMessage = (msg: string) => {
    switch (dataChannel?.readyState) {
      case 'connecting':
        console.log('Connection not open; queueing: ' + msg);
        messageQueue.push(msg);
        break;
      case 'open':
        console.log('OPEN message pathway');
        messageQueue.push(msg);
        messageQueue.forEach((msg) => {
          const messageObject = {
            event: '-', // keypressed, keyreleased, gameState, gameOver
            msg,
            timestamp: new Date(),
          };
          dataChannel.send(JSON.stringify(messageObject));
        });
        messageQueue.pop();
        break;
      case 'closing':
        console.log('Attempted to send message while closing: ' + msg);
        break;
      case 'closed':
        console.log('Error! Attempt to send while connection closed.');
        break;
    }
  };

  const emitGameState = (gameState: any) => {
    const state = JSON.stringify({ gameState: gameState });
    dataChannel?.send(state);
  };

  const emitGameOver = (roomName: string, winner: number, gameState: any) => {
    dataChannel?.send(JSON.stringify({ type: 'gameOver' }));
  };

  const keyEvent = (type: string, key: number) => {
    dataChannel?.send(JSON.stringify({ type, key }));
  };

  return (
    <Container>
      {isGameActive && dataChannel ? (
        <Game
          gameCode={gameInput}
          sendMessage={sendMessage}
          keyEvent={keyEvent}
          emitGameState={emitGameState}
          emitGameOver={emitGameOver}
          gameStateTop={gameState}
        />
      ) : (
        <>
          <ModalOverlay style={{ display: isCreateCallModalActive ? 'flex' : 'none' }}>
            <Title style={{ textAlign: 'center' }}>
              Share game code with friend: <br />
              {gameInput}
            </Title>
            <Button onClick={closeCreateCallModal}>Done</Button>
          </ModalOverlay>
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
        </>
      )}
    </Container>
  );
};
