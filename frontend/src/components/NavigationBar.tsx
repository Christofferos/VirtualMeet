import styled from 'styled-components';

import logo from '../assets/virtualMeetFullLogo.png';

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
  return (
    <nav className="navbar navbar-default navbar-inverse navbar-static-top" role="navigation">
      <div className="navbar-collapse" id="navbar-brand-centered" style={{ textAlign: 'center' }}>
        <ul className="nav navbar-nav">
          <ListItem>
            <img src={logo} style={{ height: '35px' }} alt={'Logo'} />
          </ListItem>
        </ul>
      </div>
    </nav>
  );
};
