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

export const BattletronicsGameScreen = () => {
  return (
    <Container>
      <Title>BATTLETRONICS BRAWL</Title>{' '}
      <Button onClick={() => console.log('Create')}>Create Game</Button>
      <Spacer height={15} />
      <Input
        placeholder="Code..."
        value={null ?? ''}
        onChange={(event) => console.log('Change')}
      ></Input>
      <Button onClick={() => console.log('Join')}>Join Game</Button>
      <Subtitle>[Controls]: Arrows to move, G to fire, H to pick up.</Subtitle>
    </Container>
  );
};
