import styled from 'styled-components';

const Button = styled.button`
  background: #7fa650;
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.2;
  color: #fff;
  width: 200px;
  border: none;
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
}) => {
  const webcamInstruction = (
    <>
      <Title>Start your Webcam</Title>
      <Button id="webcamButton" onClick={props.activateWebcam}>
        Start webcam
      </Button>
    </>
  );

  const callInstruction = (
    <>
      <Title>Create call</Title>
      <Button id="callButton" onClick={props.startCall}>
        Create Call
      </Button>
      <Title>Join call</Title>
      <input
        id="callInput"
        value={props.callInput ?? ''}
        onChange={(event) => props.setCallInput(event.target.value)}
        style={{ color: 'black', display: 'block', width: 200 }}
      />
      <Button id="answerButton" onClick={props.answerCall}>
        Answer
      </Button>
      <p>(Answer the call from a different browser window or device)</p>
    </>
  );

  const hangupInstruction = (
    <>
      <button id="hangupButton" disabled>
        Hangup
      </button>
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
