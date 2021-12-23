import styled from 'styled-components';
import { Spacer } from './Spacer';

const Button = styled.button`
  background: #7fa650;
  font-size: 2.4rem;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  width: 220px;
  height: 45px;
  border: none;
`;

const Input = styled.input`
  color: black;
  display: block;
  width: 220px;
  text-align: center;
`;

const Title = styled.h1``;

export const Instructions = (props: {
  activateWebcam: () => void;
  startCall: () => void;
  answerCall: () => void;
  callInput: any;
  setCallInput: React.Dispatch<any>;
  localStream: any;
  remoteStream: any;
  isCallActive: boolean;
  setIsCallActive: React.Dispatch<React.SetStateAction<boolean>>;
  toggleMic: () => void;
  micEnabled: boolean;
}) => {
  const refreshPage = () => {
    window.location.reload();
  };

  const webcamInstruction = (
    <>
      <Button id="webcamButton" onClick={props.activateWebcam}>
        Start webcam 🎥
      </Button>
    </>
  );

  const callInstruction = (
    <>
      <Button id="callButton" onClick={props.startCall}>
        Create Call
      </Button>
      <Spacer height={35} />
      <Input
        id="callInput"
        placeholder="Code..."
        value={props.callInput ?? ''}
        onChange={(event) => props.setCallInput(event.target.value)}
      />
      <Button id="answerButton" onClick={props.answerCall}>
        Join Call
      </Button>
      <p>(Join from another browser or device)</p>
    </>
  );

  const hangupInstruction = (
    <>
      <Button id="hangupButton" onClick={refreshPage}>
        Hangup
      </Button>
      <Spacer height={10} />
      <Button onClick={props.toggleMic}>{props.micEnabled ? 'Mute Mic' : 'Unmute Mic'}</Button>
    </>
  );

  let currentInstruction = null;
  if (!props.localStream) {
    currentInstruction = webcamInstruction;
  } else if (props.localStream && !props.isCallActive) {
    currentInstruction = callInstruction;
  } else if (props.remoteStream) {
    currentInstruction = hangupInstruction;
  }
  return currentInstruction;
};
