import React from 'react';
import { Button } from '@carbon/react';
import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();
  return (
    <div className="App">
      <header className="App-header">
        <img src="/images/logo.jpg" className="App-logo" alt="logo" />
        <h1>{t('welcome')}</h1>
        <Button>{t('hello_carbon')}</Button>
      </header>
    </div>
  );
}

export default App;
