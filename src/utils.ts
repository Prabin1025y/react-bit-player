//format time for showing track time
export const formatTime = (seconds: number): string => {
    const mins: number = Math.floor(seconds / 60);
    const secs: number = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const parseTimeToSeconds = (hours: number, minutes: number, seconds: number, milliseconds: number) => {
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

export const parseVTT = (vttContent: string) => {
  const lines = vttContent.split('\n');
  const cues = [];
  let currentCue: { start: number; end: number; text: string; id?: string } | null = null;

  let expectingCueTime = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and header
    if (!line || line === 'WEBVTT') {
      continue;
    }

    // Skip comment blocks
    if (line.startsWith('NOTE')) {
      while (i < lines.length && lines[i].trim() !== '') {
        i++;
      }
      continue;
    }

    // Time match (ignore anything after timestamp like settings)
    const timeMatch = line.match(/^(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})/);

    if (timeMatch) {
      if (currentCue) cues.push(currentCue);

      const startHours = timeMatch[1] ? parseInt(timeMatch[1].slice(0, -1)) : 0;
      const startMinutes = parseInt(timeMatch[2], 10);
      const startSeconds = parseInt(timeMatch[3], 10);
      const startMilliseconds = parseInt(timeMatch[4], 10);

      const endHours = timeMatch[5] ? parseInt(timeMatch[5].slice(0, -1)) : 0;
      const endMinutes = parseInt(timeMatch[6], 10);
      const endSeconds = parseInt(timeMatch[7], 10);
      const endMilliseconds = parseInt(timeMatch[8], 10);

      const start = parseTimeToSeconds(startHours, startMinutes, startSeconds, startMilliseconds);
      const end = parseTimeToSeconds(endHours, endMinutes, endSeconds, endMilliseconds);

      currentCue = {
        start,
        end,
        text: ''
      };
      expectingCueTime = false;
    } else if (!expectingCueTime && currentCue && line) {
      // Add text to current cue
      currentCue.text += (currentCue.text ? '\n' : '') + line;
    } else if (!expectingCueTime && !currentCue && line) {
      // Assume this is a cue identifier
      currentCue = { start: 0, end: 0, text: '', id: line };
      expectingCueTime = true;
    }
  }

  if (currentCue) {
    cues.push(currentCue);
  }

  return cues;
};