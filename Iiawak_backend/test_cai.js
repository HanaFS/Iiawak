const CharacterAI = require('node_characterai');
const characterAI = new CharacterAI();

(async () => {
  try {
    console.log('Authenticating as guest...');
    await characterAI.authenticateAsGuest();
    console.log('Auth success.');
    const characterId = "8_1NyR8w1dOXmI1uWaieQcd147hecbdIK7CeEAIrdJw";
    console.log('Continuing chat...');
    const chat = await characterAI.createOrContinueChat(characterId);
    console.log('Sending message...');
    const response = await chat.sendAndAwaitResponse("Hello discord mod!", true);
    console.log('Response:', response.text);
  } catch (err) {
    console.error('ERROR:', err);
  }
})();
