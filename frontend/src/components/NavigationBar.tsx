import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

import logo from '../assets/virtualMeetFullLogo.png';
import logoBattletronics from '../assets/battletronicsLogoRevamp2.png';
import { Spacer } from './Spacer';

const ListItem = styled.li`
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  cursor: pointer;
  height: 50px;
  width: 120px;
  @media (max-width: 768px) {
    width: 100vw;
  }
`;

export const NavigationBar = () => {
  let navigate = useNavigate();
  return (
    <nav
      className="navbar navbar-default navbar-inverse navbar-static-top"
      role="navigation"
      style={{ marginBottom: '0px' }}
    >
      <div className="navbar-collapse" id="navbar-brand-centered" style={{ textAlign: 'center' }}>
        <ul className="nav navbar-nav">
          <ListItem onClick={() => navigate(`/`)}>
            <img src={logo} style={{ height: '35px' }} alt={'Logo'} />
          </ListItem>
          <ListItem onClick={() => navigate(`/game`)}>
            <img src={logoBattletronics} style={{ height: '35px' }} alt={'Battletronics'} />
          </ListItem>
        </ul>
      </div>
    </nav>
  );
};
