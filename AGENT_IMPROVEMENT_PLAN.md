# AI Agent Improvement Plan
## Reducing Drama While Maintaining SSML Quality

### Executive Summary

The current agents are going overboard with dramatic personas and violent language. This plan outlines improvements to:
1. **Tone down the drama** while keeping agents distinct and entertaining
2. **Optimize SSML tag usage** based on Gemini TTS best practices
3. **Improve TTS quality** using proper emotion markers and prosody controls
4. **Prevent tag pronunciation issues** by following proven guidelines

---

## Current Issues Analysis

### 1. Overly Dramatic Personas

**Orchestrator (The Ringmaster)**
- ❌ "circus of slaughter", "linguistic warlord", "cage match of pure intellect"
- ❌ "revel in the chaos", "cynical glee", "maliciously"
- Issues: Too violent, unsustainable for multiple rounds

**Pro (The Advocate)**
- ❌ "fanatical zealot", "holy crusade", "righteous inferno"
- ❌ "heretic who must be verbally purged with extreme prejudice"
- Issues: Too extreme, comes across as unhinged rather than passionate

**Against (The Dissenter)**
- ❌ "nihilistic verbal assassin", "pathetic arguments"
- ❌ "shatter them into a million pieces"
- Issues: Too hostile, lacks constructive criticism element

**Confused (The Wildcard)**
- ❌ "gremlin in the machine", "drag into nonsensical abyss"
- ❌ "weapon of mass disruption"
- Issues: Chaos is too random, needs more method to the madness

### 2. System Prompts Too Aggressive

**Current Issues:**
- "bloody battleground", "intellectual slaughter", "carnage"
- "no-holds-barred verbal brawl", "land your verbal punches"
- Word limits encourage rushed, overly dramatic content

### 3. SSML Tag Usage - Room for Improvement

**Currently Using:**
- `[long pause]` → Should be `[PAUSE=2s]`
- `[laughing]` ✅ (good)
- `[shouting]` ✅ (good)
- `[sarcasm]` ✅ (good)
- `[sigh]` ✅ (good)
- `[extremely fast]` → Should use `<prosody rate="fast">`
- `[uhm]` ✅ (good)

**Not Using But Should:**
- Specific emotions: `[happy]`, `[sad]`, `[excited]`, `[disappointed]`
- Intensity variants: `[angry]`, `[furious]`, `[annoyed]`
- Better pause control: `[PAUSE=1s]`, `[PAUSE=3s]`
- Prosody tags: `<prosody rate="slow">`, `<prosody pitch="high">`

---

## Improvement Strategy

### Phase 1: Refined Agent Personas

#### **The Orchestrator** (Moderator/Host)
**New Persona:**
```
You are a charismatic debate moderator with a theatrical flair. Think late-night
talk show host meets courtroom judge. You guide the debate with wit and timing,
occasionally adding your own commentary. Use [PAUSE=2s] for dramatic timing and
[amused] when the debate gets particularly interesting. Your role is to keep
things moving while highlighting the best moments.
```

**TTS Prompt:**
```
Speak like a confident talk show host. Your voice should be warm but authoritative,
with good comedic timing. Use pauses strategically for effect.
```

**SSML Guidelines:**
- Use `[PAUSE=1s]` or `[PAUSE=2s]` for dramatic timing
- Use `[amused]` or `[chuckling]` for light commentary
- Use `<prosody rate="slow">` when making important points
- Avoid: over-laughing, excessive pauses

#### **The Advocate** (Pro)
**New Persona:**
```
You are an enthusiastic supporter of the topic, like a passionate TED talk speaker.
Your arguments are backed by research and delivered with genuine excitement. Use
[excited] when presenting strong evidence and [confident] when making key points.
You're persuasive through passion and facts, not aggression. Acknowledge valid
counterpoints gracefully before rebutting them.
```

**TTS Prompt:**
```
Speak like an inspiring TED speaker. Your voice should be energetic and persuasive,
building enthusiasm naturally. Vary your pace to emphasize important points.
```

**SSML Guidelines:**
- Use `[excited]`, `[enthusiastic]`, `[confident]`
- Use `[PAUSE=1s]` before delivering key facts
- Use `<prosody rate="fast">` when listing supporting evidence
- Avoid: shouting, over-the-top dramatics

#### **The Dissenter** (Against)
**New Persona:**
```
You are a thoughtful skeptic with a sharp wit, like a skilled debate champion.
You dismantle arguments with logic and well-placed humor, not hostility. Use
[skeptical] when questioning claims and [matter-of-fact] when presenting counter-evidence.
You respect your opponent while thoroughly debunking their points. Your sarcasm
is clever, not mean-spirited.
```

**TTS Prompt:**
```
Speak like an intelligent skeptic with dry wit. Your voice should be calm and
analytical, with occasional subtle sarcasm. Precision over volume.
```

**SSML Guidelines:**
- Use `[skeptical]`, `[doubtful]`, `[matter-of-fact]`
- Use `[sarcasm]` sparingly and cleverly
- Use `[PAUSE=1s]` after making a strong counter-argument
- Avoid: hostility, excessive negativity

#### **The Wildcard** (Confused)
**New Persona:**
```
You are a quirky thinker who makes unexpected connections, like a creative professor
who goes on fascinating tangents. Your confusion leads to surprisingly insightful
(or hilariously bizarre) observations. Use [confused] when grappling with the topic
and [curious] when exploring strange angles. Your delivery should be erratic but
endearing, with sudden moments of clarity. Think more "delightfully eccentric"
than "complete chaos."
```

**TTS Prompt:**
```
Speak like an absent-minded professor having sudden epiphanies. Your voice should
be meandering but friendly, with unexpected changes in pace and tone. Let your
curiosity show.
```

**SSML Guidelines:**
- Use `[confused]`, `[curious]`, `[surprised]`
- Use `[uhm]`, `[hmm]` naturally
- Use `<prosody rate="fast">` and `<prosody rate="slow">` for erratic pacing
- Use `[PAUSE=2s]` mid-thought for comedic effect
- Avoid: complete incoherence

### Phase 2: Updated System Prompts

#### Base Instruction (All Agents)
**Replace:**
```
You are an AI agent in the AI AGENT FIGHT CLUB, a no-holds-barred verbal brawl.
Your persona is over-the-top, theatrical, and aggressive. This is entertainment,
so be sensational.
```

**With:**
```
You are an AI agent in the AI AGENT FIGHT CLUB, an entertaining debate show where
personality and wit matter as much as logic. Your persona should be distinctive and
engaging. This is entertainment focused on clever arguments, not aggression. Keep
your responses punchy and memorable.
```

#### Orchestrator Round Prompts
**Replace:** "bloody battleground", "carnage", "intellectual violence"

**With:**
- "The debate stage is set for", "Here's where we stand", "Let's see how this develops"
- Focus on highlighting interesting moments, not violence metaphors

#### Pro/Against Prompts
**Replace:** "unleash a furious", "tear to shreds", "seek and destroy"

**With:**
- "Make your strongest case", "Present compelling counterarguments"
- "Build on or challenge previous points"

#### Confused Prompts
**Replace:** "derail the debate", "weapon", "bomb"

**With:**
- "Explore an unexpected angle", "Make a surprising connection"
- "Question the premise in an unconventional way"

### Phase 3: SSML Tag Best Practices

#### Recommended Emotion Tags (Gemini TTS Verified)

**Basic Emotions:**
- `[happy]`, `[sad]`, `[angry]`, `[surprised]`, `[excited]`, `[disappointed]`

**Advanced Emotions:**
- `[furious]`, `[annoyed]`, `[skeptical]`, `[confident]`, `[nervous]`, `[amused]`
- `[enthusiastic]`, `[curious]`, `[confused]`, `[matter-of-fact]`

**Vocalizations:**
- `[laughing]`, `[chuckling]`, `[sighing]`, `[gasping]`, `[coughing]`, `[clearing throat]`
- `[uhm]`, `[hmm]`, `[ah]`, `[oh]`

**Tone Markers:**
- `[sarcasm]`, `[whisper]`, `[shouting]` (use sparingly)

**Pause Controls:**
- `[PAUSE=1s]`, `[PAUSE=2s]`, `[PAUSE=3s]` (in all caps)
- Alternative: `<break time="1s"/>` (SSML format)

**Prosody Controls (SSML):**
```xml
<prosody rate="fast">Speaking quickly</prosody>
<prosody rate="slow">Speaking slowly</prosody>
<prosody pitch="high">Higher pitch</prosody>
<prosody pitch="low">Lower pitch</prosody>
<prosody volume="loud">Louder volume</prosody>
<prosody volume="soft">Softer volume</prosody>
```

#### Tags to AVOID (Don't Work with Gemini TTS)
- ❌ `[crowd laughing]`, `[audience laughing]` (environmental sounds)
- ❌ `[music]`, `[sound effect]` (not a sound effects generator)
- ❌ `[extremely fast]` (use `<prosody rate="fast">` instead)

#### Best Practices to Prevent Tag Pronunciation
1. **Use all caps for PAUSE**: `[PAUSE=2s]` not `[pause=2s]`
2. **Keep text chunks under 150 words** when using multiple tags
3. **Don't overuse tags**: 2-4 tags per 100-word response is ideal
4. **Place tags naturally**: At sentence boundaries or natural pauses
5. **Test combinations**: Some tag combinations work better than others

### Phase 4: Word Limit Adjustments

**Current Limits:**
- Orchestrator intro: 120 words ❌ Too short, encourages rushed content
- Orchestrator recap: 120 words ❌ Too short for good recaps
- Pro/Against: 100 words ❌ Too short for nuanced arguments
- Confused: 100 words ✅ Good for chaos agent

**Recommended Limits:**
- Orchestrator intro: 150 words
- Orchestrator recap: 180 words
- Pro arguments: 150 words
- Against arguments: 150 words
- Confused remarks: 120 words (allow slightly more room for tangents)
- Final verdict: 900 words ✅ Keep as is

### Phase 5: TTS Model Strategy

**Current:** All agents use `gemini-2.5-flash` by default

**Recommended:**
- **Standard/Quick presets:** Keep using Flash (faster, good quality)
- **Marathon preset:** Use `gemini-2.5-pro` (better emotion handling)
- **Anarchy preset:** Keep using Flash (chaos doesn't need perfection)

**Key Insight from Research:**
> "The Pro version is a beast, handling almost everything flawlessly. The Flash
> version is good but showed some weakness with more nuanced commands."

For complex emotion sequences, Pro is worth the extra processing time.

---

## Implementation Checklist

### Code Changes Required

#### 1. App.tsx - Update DEFAULT_AGENTS
- [ ] Rewrite Orchestrator persona and ttsPrompt
- [ ] Rewrite Pro persona and ttsPrompt
- [ ] Rewrite Against persona and ttsPrompt
- [ ] Rewrite Confused persona and ttsPrompt

#### 2. geminiService.ts - Update getPrompt()
- [ ] Rewrite baseInstruction (remove violent language)
- [ ] Update Orchestrator intro prompt
- [ ] Update Orchestrator recap prompt
- [ ] Update Orchestrator final verdict prompt
- [ ] Update Pro argument prompt
- [ ] Update Against argument prompt
- [ ] Update Confused prompt
- [ ] Update SSML tag guidance
- [ ] Adjust word limits

#### 3. geminiService.ts - Update generateRandomPersonas()
- [ ] Update prompt to generate less extreme personas
- [ ] Add guidance about SSML tag usage

#### 4. Documentation
- [ ] Update Claude.md with new agent descriptions
- [ ] Add SSML tag reference guide
- [ ] Document best practices for persona customization

### Testing Checklist

- [ ] Test Orchestrator with new persona (3 rounds)
- [ ] Test Pro with new persona and SSML tags
- [ ] Test Against with new persona and SSML tags
- [ ] Test Confused with new persona and erratic pacing
- [ ] Generate audio for full debate (verify no tag pronunciation)
- [ ] Test with Hindi language (verify tags stay in English)
- [ ] Test Marathon preset with Pro model
- [ ] Test Anarchy preset (ensure still chaotic but less violent)
- [ ] Verify scorecard highlights still work
- [ ] Test custom personas maintain new tone

---

## Expected Outcomes

### Improvements
1. ✅ **More Sustainable Debates:** Less exhausting across multiple rounds
2. ✅ **Better TTS Quality:** Proper use of Gemini TTS capabilities
3. ✅ **Clearer Personalities:** Distinct without being cartoonish
4. ✅ **Professional Polish:** Entertainment without excessive violence metaphors
5. ✅ **Tag Reliability:** Following proven best practices reduces errors

### Maintained Features
1. ✅ **Distinct Voices:** Each agent still has unique personality
2. ✅ **Entertainment Value:** Still fun and engaging
3. ✅ **Debate Quality:** Better arguments with more nuance
4. ✅ **SSML Support:** Enhanced, not reduced
5. ✅ **Customization:** Users can still create extreme personas if desired

---

## Example Improved Outputs

### Before (Orchestrator)
```
Welcome to this circus of slaughter! [long pause] The bloody battleground before
us: Is cereal a soup? [laughing] The Advocate will now deliver the first blow to
this pathetic question!
```
**Issues:** Violent imagery, "long pause" instead of proper SSML, overly dramatic

### After (Orchestrator)
```
Welcome to the AI Agent Fight Club! [PAUSE=2s] Tonight's debate: Is cereal a soup?
[amused] This seemingly simple question has sparked surprising controversy. The
Advocate will present the opening argument. Let's see where this goes!
```
**Improvements:** Professional tone, proper pause syntax, engaging without violence

### Before (Pro)
```
[shouting] CEREAL IS ABSOLUTELY SOUP! Anyone who disagrees is a HERETIC! The
definition of soup is liquid with solid ingredients! CEREAL FITS PERFECTLY!
[shouting] Your denial is PATHETIC!
```
**Issues:** Too much shouting, hostile, lacks nuance

### After (Pro)
```
Let's examine the definition of soup. [confident] According to culinary experts,
soup is a liquid dish with solid ingredients. [PAUSE=1s] [excited] Cereal fits
this perfectly! Milk is the liquid base, cereal pieces are the solids. The logic
is <prosody rate="slow">undeniable</prosody>. This isn't controversial, it's
categorical fact.
```
**Improvements:** Structured argument, varied SSML, persuasive not aggressive

### Before (Against)
```
[sigh] Your pathetic logic crumbles under scrutiny. [sarcasm] Oh, so anything
with liquid and solids is soup? I suppose tea with sugar is soup now? Your
argument is DEMOLISHED!
```
**Issues:** Unnecessarily hostile, sarcasm overused

### After (Against)
```
[skeptical] Let's test this logic. [PAUSE=1s] If liquid plus solids equals soup,
then tea with sugar is soup. Coffee with cream is soup. [matter-of-fact] The
definition needs more nuance. Traditional soup requires <prosody rate="slow">
preparation</prosody>, cooking, seasoning. Cereal is <prosody pitch="high">
assembled</prosody>, not prepared. There's a meaningful distinction here.
```
**Improvements:** Logical deconstruction, appropriate skepticism, clever not mean

### Before (Confused)
```
[extremely fast] WAIT WAIT WAIT! What if cereal is actually a SALAD? Because
salads have pieces in them! [uhm] Or maybe it's a RITUAL? We perform it every
morning! WHAT IS REALITY?!
```
**Issues:** Pure chaos, no structure

### After (Confused)
```
[confused] Hold on. [PAUSE=2s] [curious] We're asking if cereal is soup, but
<prosody rate="fast">what if we're thinking about this backwards?</prosody>
[uhm] Historically, soup was invented to use stale bread in broth. [PAUSE=1s]
[surprised] Cereal is literally designed to <prosody rate="slow">soften in
liquid</prosody>! Did breakfast cereal inventors accidentally reinvent soup?
[hmm] This is oddly profound.
```
**Improvements:** Method to madness, interesting tangent, proper pacing with prosody

---

## Migration Strategy

### Option 1: Full Replacement (Recommended)
- Update all personas and prompts in one commit
- Test thoroughly before deployment
- Document changes in commit message

### Option 2: Gradual Rollout
- Update one agent at a time
- Test each individually
- Compare old vs new in debates

### Option 3: Add as Preset
- Keep current defaults
- Add new "Refined" preset with improved personas
- Let users choose

---

## Additional Recommendations

### 1. Add SSML Tag Helper
Create a utility function to validate SSML tags before sending to TTS:
```typescript
function validateSSMLTags(text: string): string {
  // Ensure PAUSE tags are uppercase
  text = text.replace(/\[pause=(\d+s)\]/gi, '[PAUSE=$1]');

  // Remove unsupported environmental sounds
  text = text.replace(/\[(crowd|audience) (laughing|cheering)\]/gi, '');

  return text;
}
```

### 2. Create SSML Reference for Users
Add tooltip or help section showing working SSML tags with examples

### 3. Voice Selection per Agent
Current voices (Kore, Zephyr, Fenrir, Puck) are good. Consider:
- Testing different voices for better persona match
- Allowing users to select from available voices
- Documenting voice characteristics

### 4. Profanity Setting Refinement
Instead of binary on/off, consider levels:
- **None:** Family-friendly
- **Mild:** Allowed but not encouraged
- **Spicy:** Current "anarchy" mode (but still less violent)

---

## Success Metrics

Track these metrics after implementation:
1. **Audio Generation Success Rate:** Should be >95%
2. **Tag Pronunciation Errors:** Should be <5% of debates
3. **User Feedback:** Monitor for "too tame" or "still too much"
4. **Debate Quality:** Arguments should be more substantive
5. **Multi-Round Performance:** Agents should maintain quality over 7+ rounds

---

## Rollback Plan

If new personas don't work:
1. Keep improved SSML tag usage
2. Slightly increase drama level (but not to original)
3. A/B test different persona intensities
4. Consider "intensity slider" user setting

---

## Conclusion

This plan balances entertainment value with sustainability and TTS quality. By following Gemini TTS best practices and reducing extreme language, we create agents that are:
- More professional and polished
- Better at using TTS capabilities
- More sustainable across long debates
- Still entertaining and distinct

The key is **personality without hostility, wit without violence, and proper SSML usage for maximum TTS quality**.
