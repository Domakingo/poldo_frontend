# Poldo - Applicazione Web per Prenotazioni al Bar della Scuola

## 1. Introduzione

### 1.1 Descrizione
Poldo mira a risolvere il problema delle code durante gli intervalli scolastici, ottimizzando il processo di ordinazione e ritiro di cibi e bevande dal bar della scuola. L'applicazione faciliterà la gestione degli ordini sia dal lato utente (studenti e professori) che dal lato fornitore (gestore del bar).

### 1.2 Team Sviluppatori
- Marta Genovese
- Giacomo Marconi
- Francesco Miranda

### 1.3 Glossario

| Termine | Definizione |
|---------|-------------|
| **Scheda prodotto** | Elemento all'interno di una pagina che descrive un prodotto tramite immagine, etichette, pulsanti per aggiunta e rimozione dal carrello, disponibilità. Sul retro, accessibile tramite tocco sulla scheda, dettagli prodotto |
| **Paninaro** | Utente con la possibilità di contrassegnare ogni singolo ordine come validato per comporre l'ordine di classe, inoltre ha la possibilità di visualizzare il QR-Code per ritirare l'ordine |
| **Classe** | Classe di studenti all'interno dell'istituto |
| **Ordine individuale** | Ordine effettuato da un singolo utente (studente o professore) |
| **Ordine di classe** | Aggregazione di ordini individuali di una stessa classe, gestito dal paninaro |
| **Terminale** | Totem per l'ordinazione di prodotti installato all'interno della scuola |

## 2. Descrizione del Sistema

### 2.1 Contesto
Poldo è un'applicazione web accessibile via browser da dispositivi mobili e desktop, e necessita di integrazione con i servizi di autenticazione Google per studenti, professori e admin.

### 2.2 Funzionalità
#### L'applicazione permette agli studenti di:
- Effettuare ordini
- Ritirare prodotti tramite codice QR se si è paninari
- Visualizzare la cronologia ordini giornalieri

#### Il gestore del bar può:
- Gestire il catalogo prodotti
- Monitorare e gestire gli ordini
- Generare report sulle vendite
- Confermare la preparazione e il ritiro degli ordini tramite scansione QR-code

#### L'admin può:
- Gestire i ruoli utente
- Configurare parametri del sistema
- Accedere a tutte le funzionalità degli altri ruoli

### 2.3 Tipologie di Utenti

| Ruolo | Descrizione | Autenticazione |
|-------|-------------|----------------|
| **Studente** | Utente base che può effettuare ordini personali aggregati alla sua classe | Google |
| **Paninaro** | Studente con privilegi estesi per gestire ordini di classe | Google |
| **Professore** | Utente che può effettuare ordini individuali | Google |
| **Gestore del Bar** | Responsabile della gestione prodotti e ordini | Username/Password |
| **Admin** | Supervisore con accesso completo al sistema | Google |

### 2.4 Ambiente Operativo
L'applicazione sarà:
- Web-based, accessibile tramite browser
- Responsive per l'utilizzo su dispositivi mobili e desktop
- Integrata con i servizi di autenticazione Google

## 3. Requisiti Funzionali

### 3.1 Autenticazione e Gestione Utenti

| Requisito | Priorità |
|-----------|----------|
| Autenticazione tramite Google per studenti, professori e admin | MUST |
| Autenticazione locale (username/password) per i gestori del bar | MUST |
| Attivazione del ruolo "Paninaro" tramite token ottenuto a inizio anno | MUST |
| Possibilità per gli admin di modificare i ruoli degli utenti | MUST |
| Le sessioni utente devono utilizzare token JWT con scadenza dopo 30 minuti di inattività | SHOULD |

### 3.2 Gestione Prodotti per Gestori Bar

| Requisito | Priorità |
|-----------|----------|
| Aggiunta nuovi prodotti specificando nome, prezzo, immagine, ingredienti, tipo e disponibilità | MUST |
| Modificare le informazioni dei prodotti esistenti | MUST |
| Impostare la disponibilità giornaliera dei prodotti | MUST |
| Nascondere/mostrare prodotti nel menu | SHOULD |
| Designare prodotti come "temporanei" (validi solo per il giorno corrente) | SHOULD |

### 3.3 Visualizzazione Menu e Prodotti

| Requisito | Priorità |
|-----------|----------|
| Visualizzare i prodotti disponibili in un menu con schede prodotto | MUST |
| Visualizzare i dettagli del prodotto toccando la scheda | MUST |
| Visualizzare un riepilogo dell'ordine corrente accanto al menu | MUST |
| Consentire agli utenti di filtrare i prodotti per nome, prezzo, tipo, disponibilità e ingredienti | SHOULD |
| Visualizzare etichette grafiche per specificare il tipo di prodotto | SHOULD |
| Suddividere il menu in prodotti normali e temporanei | COULD |
| Salvare prodotti preferiti per un accesso rapido | COULD |
| Salvare fino a tre template di ordine | COULD |

### 3.4 Gestione Ordini (Stunte / Professore)

| Requisito | Priorità |
|-----------|----------|
| Aggiungere/rimuovere prodotti dal carrello | MUST |
| Confermare l'ordine per i Paninari | MUST |
| Aggregare gli ordini individuali in ordini di classe | MUST |
| Validare gli ordini individuali per comporre l'ordine di classe per i Paninari | MUST |
| Generare un codice QR univoco per il ritiro dell'ordine | SHOULD |
| Visualizzare la cronologia dei propri ordini | COULD |
| Consentire ai professori di inviare il proprio QR code a un paninaro a scelta | COULD |

### 3.5 Gestione Ordini (Gestore del Bar)

| Requisito | Priorità |
|-----------|----------|
| Visualizzare gli ordini suddivisi per classe o per prodotto | MUST |
| Marcare gli ordini come "preparati" | MUST |
| Confermare il ritiro degli ordini tramite scansione del QR code | SHOULD |

### 3.6 Reporting e Statistiche

| Requisito | Priorità |
|-----------|----------|
| Generare report di vendite per finestra di tempo | COULD |
| Consentire l'esportazione dei report in formato PDF/CSV | COULD |
| Visualizzare grafici sull'andamento delle vendite per prodotto | COULD |
| Calcolare e visualizzare una classifica delle classi per spesa totale e ordini | COULD |
| Aggiornare la classifica delle classi una volta al giorno | COULD |

## 4. Requisiti Non Funzionali

### 4.1 Performance

| Requisito | Priorità |
|-----------|----------|
| Supportare l'utilizzo simultaneo da parte di più utenti | MUST |

### 4.2 Usabilità

| Requisito | Priorità |
|-----------|----------|
| Interfaccia responsive compatibile con dispositivi mobili e desktop | MUST |
| Feedback delle azioni (conferme, errori) | SHOULD |

### 4.3 Manutenibilità

| Requisito | Priorità |
|-----------|----------|
| Registrazione log  | SHOULD |
