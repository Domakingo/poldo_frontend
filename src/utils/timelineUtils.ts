/**
 * Utility functions for timeline components
 */

/**
 * Formats a time string to HH:MM format
 * @param time - Time string or number in various possible formats
 * @returns Formatted time string in HH:MM format
 */
export const formatTime = (time: string | number): string => {
  if (!time) {
    console.warn('Orario vuoto passato a formatTime');
    return '';
  }
  
  try {
    // Se l'orario è un numero, convertilo prima in stringa
    if (typeof time === 'number') {
      time = time.toString();
    } else if (typeof time !== 'string') {
      // Se l'orario non è una stringa o un numero, torna a stringa vuota
      time = '';
    }
    
    // Assicurati di lavorare con una stringa
    const timeStr = String(time);
    
    // Se l'orario include i secondi (HH:MM:SS), rimuovili
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length >= 2) {
        // Assicurati che ore e minuti siano a due cifre
        const hours = parts[0].padStart(2, '0');
        const minutes = parts[1].padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    
    // Se l'orario è nel formato HHMM (es. 1430), convertilo in HH:MM
    if (timeStr.length === 4 && !timeStr.includes(':') && !isNaN(Number(timeStr))) {
      return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
    }
    
    // Se l'orario è solo un'ora (es. "14"), aggiungi i minuti
    if (timeStr.length <= 2 && !isNaN(Number(timeStr))) {
      return `${timeStr.padStart(2, '0')}:00`;
    }
    
    // Se l'orario contiene un punto invece di due punti (es. "14.30")
    if (timeStr.includes('.')) {
      const [hours, minutes] = timeStr.split('.');
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    // Ultima risorsa: prova a estrarre le cifre e formattarle
    const digits = timeStr.replace(/[^0-9]/g, '');
    if (digits.length >= 3) {
      const hours = digits.substring(0, 2);
      const minutes = digits.substring(2, 4).padEnd(2, '0');
      return `${hours}:${minutes}`;
    }
    
    console.warn(`Impossibile formattare l'orario: "${time}"`);
    return timeStr;
  } catch (error) {
    console.error('Errore nella formattazione dell\'orario:', time, error);
    return String(time) || '';
  }
}

/**
 * Converts a time string (HH:MM) to minutes from midnight
 * @param timeString - Time string in various formats
 * @returns Number of minutes from midnight
 */
export const timeToMinutes = (timeString: string): number => {
  if (!timeString) {
    console.warn('Stringa di orario vuota passata a timeToMinutes');
    return 0;
  }
  
  try {
    // Se già nel formato HH:MM, semplicemente converti in minuti
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato HH:MM non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + (minutes || 0);
    }
    
    // Se nel formato HHMM (es. "1430")
    if (timeString.length === 4 && !timeString.includes(':') && !isNaN(Number(timeString))) {
      const hours = Number(timeString.substring(0, 2));
      const minutes = Number(timeString.substring(2, 4));
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato HHMM non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + minutes;
    }
    
    // Se solo ore (es. "14")
    if (timeString.length <= 2 && !isNaN(Number(timeString))) {
      const hours = Number(timeString);
      return hours * 60;
    }
    
    // Se è qualcosa come "12.30" (con punto invece di due punti)
    if (timeString.includes('.')) {
      const [hours, minutes] = timeString.split('.').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        console.warn(`Formato ore.minuti non valido in "${timeString}"`);
        return 0;
      }
      return hours * 60 + minutes;
    }
    
    console.warn(`Formato orario non riconosciuto: "${timeString}"`);
    
    // Ultima risorsa: prova a estrarre i numeri e usarli
    const numbersOnly = timeString.replace(/[^0-9]/g, '');
    if (numbersOnly.length >= 3) {
      const hours = Number(numbersOnly.substring(0, 2));
      const minutes = Number(numbersOnly.substring(2));
      return hours * 60 + (minutes || 0);
    }
    
    return 0;
  } catch (error) {
    console.error(`Errore nell'analisi dell'orario "${timeString}":`, error);
    return 0;
  }
}

/**
 * Calculates the position on the timeline based on time
 * @param time - Time string in HH:MM format
 * @returns Position as percentage (0-100)
 */
export const calculateTimePosition = (time: string): number => {
  // Usa un intervallo più ampio per la timeline (7:00 AM a 7:00 PM)
  const startTime = 7 * 60; // 7:00 in minuti
  const endTime = 19 * 60; // 19:00 in minuti
  const timeInMinutes = timeToMinutes(time);
    
  // Calcola la posizione come percentuale
  return Math.max(0, Math.min(100, ((timeInMinutes - startTime) / (endTime - startTime)) * 100));
}

/**
 * Calculates time slots for the timeline
 * @returns Array of time slots with position and label
 */
export const calculateTimelineSlots = () => {
  const slots = []
  // Crea slot per ogni ora dalle 7:00 alle 19:00 (7 PM)
  for (let hour = 7; hour <= 19; hour++) {
    // Aggiungi l'ora intera
    slots.push({
      time: `${hour}:00`,
      position: calculateTimePosition(`${hour}:00`),
      label: `${hour}:00`
    })
    
    // Aggiungi la mezz'ora (tranne per l'ultima ora)
    if (hour < 19) {
      slots.push({
        time: `${hour}:30`,
        position: calculateTimePosition(`${hour}:30`),
        label: `${hour}:30`
      })
    }
  }
  return slots
}

/**
 * Formats a price as currency
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`
}
