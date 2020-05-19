const Alexa = require('ask-sdk-core');
const Spotify = require('./SpotifyOAuthFactory');
const Quotes = require('./HaloQuotes');
const TRIVIA_QUOTE_COUNT = 10;

//handlers
const HaloQuoteIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HaloQuoteIntent';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const characterName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'characterName');
        const speakOutput = getQuote(handlerInput, sessionAttributes, characterName, false);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Find another quote or start trivia?")
            .getResponse();
    }
};
const HaloQuoteTriviaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HaloQuoteTriviaIntent';
    },
    handle(handlerInput) {
        let speakOutput = 'Too bad you changed your mind!';
        let quote = 'Find a quote or start trivia?';
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if(handlerInput.requestEnvelope.request.intent.confirmationStatus === 'CONFIRMED') {
            initializeTriviaQuotes(handlerInput, sessionAttributes);
            speakOutput = 'You must guess who said the following ' + TRIVIA_QUOTE_COUNT + ' quotes from the following halo characters: ';
            let allNames = Object.keys(Quotes);
            allNames.forEach(name => {
                speakOutput += name;
                if(name !== allNames[allNames.length-1]) {
                    speakOutput += ', ';
                } else {
                    speakOutput += '. Here is your first quote: ';
                }
            });
            quote = sessionAttributes.quotes[sessionAttributes.triviaQuestionIndex].quote;
            speakOutput += quote;
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(quote)
            .getResponse();
    }
};
const TriviaAnswerIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TriviaAnswerIntent';
    },
   handle(handlerInput) {
        let characterName = Alexa.getSlotValue(handlerInput.requestEnvelope, 'characterName');
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        let speakOutput;
        if(Quotes[characterName.toLowerCase()] === undefined) {
            characterName = getSlotValueSynonym(handlerInput, 'characterName');
        }
        if(characterName === sessionAttributes.quotes[sessionAttributes.triviaQuestionIndex].name) {
            sessionAttributes.score++;
            speakOutput = "That's right, the quote is from " + characterName + "! ";
        } else {
            speakOutput = "Sorry, that's incorrect.  The correct answer is " + sessionAttributes.quotes[sessionAttributes.triviaQuestionIndex].name + "! ";
        }
        sessionAttributes.triviaQuestionIndex++;
        let quote = askQuestion(sessionAttributes);
        speakOutput += quote;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(quote)
            .getResponse();
    }
};
const HaloTwoEasterEggIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HaloTwoEasterEggIntent';
    },
    async handle(handlerInput) {
        const speakOutput = 'Sir. Finishing this fight!';
        const token = await Spotify.getAccessToken();
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .addAudioPlayerPlayDirective(
                'REPLACE_ALL',
                'https://api.spotify.com/v1/tracks/3FDmLXhaBz9AGLVJClShbC',
                token,
                11200
            )
            .getResponse();
    }
};

//private utilities
const getQuote = function(handlerInput, sessionAttributes, characterName, isTrivia) {
    if(characterName === "any") {
        let allNames = Object.keys(Quotes);
        characterName = allNames[Math.floor(Math.random() * allNames.length)];
    } else if(Quotes[characterName.toLowerCase()] === undefined) {
        //check if a synonym was used
        characterName = getSlotValueSynonym(handlerInput, 'characterName');
    }
    if(characterName === '') return "No quote for that character found! ";
    sessionAttributes.characterName = characterName;
    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);
    let characterQuoteIndex = Math.floor(Math.random() * Quotes[characterName.toLowerCase()].length);
    if(isTrivia) {
        return {
            'quote': Quotes[characterName.toLowerCase()][characterQuoteIndex],
            'name': characterName.toLowerCase()
        };
    }
    return Quotes[characterName.toLowerCase()][characterQuoteIndex];
};
const initializeTriviaQuotes = function(handlerInput, sessionAttributes) {
    //initialize index and points to 0
    sessionAttributes.score = 0;
    sessionAttributes.triviaQuestionIndex = 0;
    sessionAttributes.quotes = [];
    //build array of quotes
    while(sessionAttributes.quotes.length < TRIVIA_QUOTE_COUNT) {
        let quote = getQuote(handlerInput, sessionAttributes, "any", true);
        if(sessionAttributes.quotes.length === 0 || sessionAttributes.quotes.some(n => n.quote !== quote.quote)) {
            sessionAttributes.quotes.push(quote);
        }
    }
};
const askQuestion = function(sessionAttributes) {
  const triviaQuestionIndex = sessionAttributes.triviaQuestionIndex;

  if (triviaQuestionIndex >= TRIVIA_QUOTE_COUNT) {
    return 'You\'re final score is ' + sessionAttributes.score + ' out of ' + TRIVIA_QUOTE_COUNT + ". You can say trivia to play again, or ask for a random quote.";
  } else {
    var currentQuestion = sessionAttributes.quotes[triviaQuestionIndex].quote;
    return 'Quote ' + (triviaQuestionIndex + 1) + ' out of ' + TRIVIA_QUOTE_COUNT + ': ' + currentQuestion;
  }
};
const getSlotValueSynonym = function(handlerInput, slotTypeName) {
    try {
        return Alexa.getSlot(handlerInput.requestEnvelope, slotTypeName).resolutions.resolutionsPerAuthority[0].values[0].value.name;
    }
    catch(err) {
        return '';
    }
}

//exports
exports.HaloQuoteIntentHandler = HaloQuoteIntentHandler;
exports.HaloQuoteTriviaIntentHandler = HaloQuoteTriviaIntentHandler;
exports.TriviaAnswerIntent = TriviaAnswerIntent;
exports.HaloTwoEasterEggIntentHandler = HaloTwoEasterEggIntentHandler;