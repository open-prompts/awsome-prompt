import React from 'react';
import { Content } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import TemplateList from './components/TemplateList';

function App() {
  const { t } = useTranslation();
  return (
    <div className="App">
      <header className="App-header">
        <img src="/images/logo.jpg" className="App-logo" alt="logo" />
        <h1>{t('welcome')}</h1>
      </header>
      <Content>
        <TemplateList />
      </Content>
    </div>
  );
}

export default App;
