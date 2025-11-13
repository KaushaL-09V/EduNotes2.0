// testYTPlus.mjs
import { fetchTranscript } from 'youtube-transcript-plus';

const videoIdOrUrl = 'dPl9P3b1_O0';

try {
  const transcriptData = await fetchTranscript(videoIdOrUrl, { lang: 'hi' });

  if (!transcriptData || transcriptData.length === 0) {
    console.log('No transcript available for this video');
    process.exit();
  }

  const transcript = transcriptData.map(item => item.text).join(' ').replace(/\s+/g, ' ').trim();
  console.log('Transcript fetched successfully:');
  console.log(transcript);
  console.log('\nNumber of segments:', transcriptData.length);

} catch (err) {
  console.error('Error fetching transcript:', err.message);
}
