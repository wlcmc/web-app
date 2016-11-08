import React, { PropTypes } from 'react';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';
import classNames from 'classnames';

import Header from '../AdminLTE/Header';
import Sidebar from '../Sidebar';
import PageContent from '../PageContent';
import Footer from '../AdminLTE/Footer';

export const Layout = ({
  toggleSize,
  toggleVisibility,
  sidebar,
  isLoggedIn,
  children,
  lang,
  currentUrl,
  availableLangs,
  onCloseSidebar
}) => (
  <div
    className={classNames({
      'wrapper': true,
      'sidebar-mini': true,
      'sidebar-collapse': sidebar.isCollapsed,
      'sidebar-open': sidebar.isOpen
    })}
    style={{
      overflow: 'visible'
    }}>
    <Helmet
      defaultTitle='ReCodEx'
      titleTemplate='%s | ReCodEx' />
    <Header
      toggleSidebarSize={toggleSize}
      toggleSidebarVisibility={toggleVisibility}
      availableLangs={availableLangs}
      currentLang={lang}
      currentUrl={currentUrl} />
    <Sidebar
      isLoggedIn={isLoggedIn}
      isCollapsed={sidebar.isCollapsed}
      currentUrl={currentUrl} />
    <div onClick={onCloseSidebar}>
      {children}
      <Footer version='v0.4.0' />
    </div>
  </div>
);

Layout.propTypes = {
  toggleSize: PropTypes.func,
  toggleVisibility: PropTypes.func,
  sidebar: PropTypes.shape({
    isCollapsed: PropTypes.bool,
    isOpen: PropTypes.bool
  }),
  isLoggedIn: PropTypes.bool,
  onCloseSidebar: PropTypes.func,
  children: PropTypes.element
};

export default Layout;
