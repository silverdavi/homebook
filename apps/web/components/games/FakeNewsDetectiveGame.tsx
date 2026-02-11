"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RotateCcw, Shield, AlertTriangle, CheckCircle2, XCircle, Search, Eye } from "lucide-react";
import Link from "next/link";
import { getLocalHighScore, setLocalHighScore, trackGamePlayed, getProfile } from "@/lib/games/use-scores";
import { checkAchievements } from "@/lib/games/achievements";
import type { NewAchievement } from "@/lib/games/achievements";
import { ScoreSubmit } from "@/components/games/ScoreSubmit";
import { StreakBadge, getMultiplierFromStreak } from "@/components/games/RewardEffects";
import { AchievementToast } from "@/components/games/AchievementToast";
import { AudioToggles, useGameMusic } from "@/components/games/AudioToggles";
import { sfxCorrect, sfxWrong, sfxCombo, sfxLevelUp, sfxGameOver, sfxAchievement, sfxCountdown, sfxCountdownGo, sfxStreakLost, sfxPerfect } from "@/lib/games/audio";
import { createAdaptiveState, adaptiveUpdate, getDifficultyLabel, type AdaptiveState } from "@/lib/games/adaptive-difficulty";
import { getGradeForLevel } from "@/lib/games/learning-guide";

/* ─── Types ──────────────────────────────────────────────────────── */

type GamePhase = "menu" | "countdown" | "playing-story" | "playing-reason" | "reveal" | "complete";

interface NewsStory {
  id: string;
  headline: string;
  body: string;
  source: string;
  isReal: boolean;
  difficulty: number; // 1-8, maps to grade tiers
  category: string;
  redFlags: string[];
  explanation: string;
  teachingPoint: string;
}

interface RoundResult {
  story: NewsStory;
  calledReal: boolean;
  reasonCorrect: boolean;
  correct: boolean;
  fast: boolean;
}

/* ─── Story Database ─────────────────────────────────────────────── */

const STORIES: NewsStory[] = [
  // ── Difficulty 1: Very obvious (Grade 1-2) ──
  { id: "o1", headline: "Dog Elected Mayor of Small Town", body: "Residents of Sunnyville voted a golden retriever named Max as their new mayor. Max's campaign promises included more fire hydrants and mandatory belly rubs for all citizens.", source: "The Sunnyville Gazette", isReal: false, difficulty: 1, category: "impossible-claim", redFlags: ["Dogs cannot run for political office", "Silly campaign promises", "No real town called Sunnyville"], explanation: "While there have been a few real cases of animals as honorary mascots, dogs cannot actually be elected to government positions. Real news about elections involves human candidates.", teachingPoint: "Real news is about things that can actually happen." },
  { id: "o2", headline: "Scientists Discover Fish That Can Fly to the Moon", body: "A team of marine biologists at Ocean University claim they found a species of fish in the Pacific Ocean that can launch itself into space and reach the moon in just 3 hours.", source: "Science Daily News Blog", isReal: false, difficulty: 1, category: "impossible-claim", redFlags: ["Fish cannot survive outside water", "Nothing can reach the moon in 3 hours", "No real university called Ocean University"], explanation: "This is clearly impossible. Fish need water to breathe, and no animal can fly to the moon. Real science articles describe things that are actually possible.", teachingPoint: "If something sounds impossible, it probably is." },
  { id: "o3", headline: "Library Opens New Section for Children's Books", body: "The Central Public Library announced today it will expand its children's reading area with 500 new books. The new section will include a cozy reading nook and weekly story time sessions.", source: "City News Network", isReal: true, difficulty: 1, category: "credible-report", redFlags: ["Specific, realistic details", "Normal event that happens in real life", "Named a real-sounding institution"], explanation: "This is a normal, realistic news story. Libraries really do expand their collections and add new programs. The details are specific and believable.", teachingPoint: "Real news describes things that happen in everyday life." },
  { id: "o4", headline: "Boy Rides Bicycle Across the Ocean in One Day", body: "12-year-old Tommy from Lakeside rode his bicycle across the Atlantic Ocean yesterday, covering 3,000 miles in just 8 hours. He said he didn't even get tired.", source: "Amazing Kids Weekly", isReal: false, difficulty: 1, category: "impossible-claim", redFlags: ["Bicycles don't work on water", "3,000 miles in 8 hours is impossible on a bicycle", "No one can bike without getting tired for 8 hours"], explanation: "You can't ride a bicycle across the ocean — there's no road! And 3,000 miles in 8 hours would be 375 mph, which is faster than a race car. Real news uses numbers that make sense.", teachingPoint: "Check if the numbers in a story are realistic." },
  { id: "o5", headline: "New Park Opens with Playground and Walking Trails", body: "Mayor Johnson cut the ribbon on Riverside Park yesterday. The new 10-acre park features a playground, three walking trails, and picnic areas. Construction took 18 months.", source: "Riverside Herald", isReal: true, difficulty: 1, category: "credible-report", redFlags: ["Specific name and details", "Reasonable timeline", "Normal community event"], explanation: "This is a typical local news story. Parks really do get built with these kinds of features, and the timeline is realistic.", teachingPoint: "Real news has specific, checkable details." },
  { id: "o6", headline: "Cat Learns to Speak English and Reads Bedtime Stories", body: "A house cat named Whiskers has learned over 200 English words and now reads bedtime stories to neighborhood children every evening, according to his owner.", source: "Pet World Today", isReal: false, difficulty: 1, category: "impossible-claim", redFlags: ["Cats cannot speak human languages", "Cats cannot read", "Only the owner's claim with no evidence"], explanation: "Cats can make sounds, but they cannot speak English or read books. When a story makes claims that go against basic facts about how animals work, it's not real.", teachingPoint: "Think about whether something is actually possible before believing it." },

  // ── Difficulty 2: Clickbait (Grade 3) ──
  { id: "c1", headline: "You Won't BELIEVE What This Student Found in Her Lunchbox!!", body: "Teachers HATE this one simple trick! A student at Elm Street Elementary opened her lunchbox to find something SO SHOCKING that the entire school had to be evacuated. Click to find out what it was!", source: "ViralBuzz.net", isReal: false, difficulty: 2, category: "clickbait", redFlags: ["ALL CAPS and exclamation marks", "'You won't believe' language", "Doesn't actually tell you what happened", "Tries to make you click"], explanation: "This uses classic clickbait tactics: extreme language (BELIEVE, SHOCKING), lots of punctuation, and it doesn't actually tell you the news. Real journalism tells you what happened upfront.", teachingPoint: "Real news tells you what happened. Clickbait tries to trick you into clicking." },
  { id: "c2", headline: "THIS Fruit Will Make You 10 Times Smarter — Doctors Are FURIOUS!", body: "A common fruit found in every grocery store has been proven to boost IQ by 1000%. Medical professionals are trying to keep this secret from the public. Big Pharma doesn't want you to know!", source: "HealthTruth247.com", isReal: false, difficulty: 2, category: "clickbait", redFlags: ["Extreme claims (10 times smarter, 1000%)", "'Doctors are furious' — typical clickbait pattern", "Conspiracy language ('Big Pharma')", "No specific fruit named"], explanation: "No single food can make you '10 times smarter.' This uses clickbait patterns: extreme claims, saying doctors/experts don't want you to know, and vague details. Real health articles cite specific studies.", teachingPoint: "Be suspicious when articles claim experts are 'hiding' something from you." },
  { id: "c3", headline: "Local Swim Team Wins Regional Championship", body: "The Oakdale Middle School swim team won the regional championship last Saturday, beating 12 other teams. Team captain Sarah Chen set a new record in the 100m freestyle with a time of 58.3 seconds.", source: "Oakdale Tribune", isReal: true, difficulty: 2, category: "credible-report", redFlags: ["Specific names, dates, and numbers", "Realistic achievements", "Local newspaper source"], explanation: "This story has specific, verifiable details: names, dates, scores, and a local newspaper source. The achievement is impressive but realistic. This is how real local news is written.", teachingPoint: "Real news includes specific names, dates, and facts you could verify." },
  { id: "c4", headline: "This WEIRD Trick Makes Homework Disappear — Teachers Don't Want You to Know!", body: "Students everywhere are using this one bizarre hack to make all their homework vanish instantly. Schools are panicking and trying to ban it, but it's too late!", source: "StudentHacks.co", isReal: false, difficulty: 2, category: "clickbait", redFlags: ["'Weird trick' clickbait formula", "Impossible claim (homework disappearing)", "'Teachers don't want you to know'", "No details about the actual trick"], explanation: "This follows the classic clickbait formula: 'one weird trick' + 'they don't want you to know.' It never explains what the trick actually is because there is no trick. Real advice articles explain things clearly.", teachingPoint: "'One weird trick' is almost always a sign of clickbait." },
  { id: "c5", headline: "School District Adds New Bus Routes for Safety", body: "The Greenfield School District announced three new bus routes starting next month to reduce walk times for students living more than a mile from school. The change follows a traffic safety study conducted last spring.", source: "Greenfield Daily News", isReal: true, difficulty: 2, category: "credible-report", redFlags: ["Specific policy change", "Clear reason given", "Based on a study", "Realistic local news"], explanation: "This is straightforward local reporting. It explains what changed, why, and gives context (the traffic study). No sensational language or extreme claims.", teachingPoint: "Good news reporting explains the what, why, and how calmly." },

  // ── Difficulty 3: Source checking (Grade 4) ──
  { id: "s1", headline: "Breaking: Major Earthquake Hits California Coast", body: "A 7.2 magnitude earthquake struck the northern California coast at 3:42 AM Pacific time. The USGS confirmed the epicenter was 15 miles offshore. No tsunami warning has been issued.", source: "Associated Press", isReal: true, difficulty: 3, category: "credible-report", redFlags: ["Associated Press is a trusted global news agency", "Cites official source (USGS)", "Specific measurable details", "Balanced — notes no tsunami warning"], explanation: "The Associated Press (AP) is one of the most trusted news agencies in the world. This story cites the USGS (a real government agency), gives specific measurements, and is balanced.", teachingPoint: "Check if the source is a known, trusted news organization." },
  { id: "s2", headline: "New Study Shows Video Games Improve Brain Function by 300%", body: "Research published by the Institute for Digital Wellness proves that playing video games for 8 hours daily dramatically improves cognitive function. Parents should encourage unlimited screen time.", source: "DigitalWellnessToday.org", isReal: false, difficulty: 3, category: "bad-source", redFlags: ["Institute for Digital Wellness doesn't exist", "300% improvement is an extreme claim", "8 hours daily contradicts medical advice", "Recommending 'unlimited screen time' is irresponsible"], explanation: "The 'Institute for Digital Wellness' isn't a real research institution. Real studies show some benefits of moderate gaming, but '300% improvement' and 'unlimited screen time' are red flags. Always check if the institution is real.", teachingPoint: "Search for the organization that published a study — is it real?" },
  { id: "s3", headline: "Zoo Welcomes Three Baby Penguins Born This Week", body: "The City Zoo announced the birth of three Humboldt penguin chicks this week. The chicks, weighing about 80 grams each, are being monitored by the veterinary team. Public viewing begins next month.", source: "City Zoo Press Release", isReal: true, difficulty: 3, category: "credible-report", redFlags: ["Press release from the zoo itself", "Specific species and weight", "Realistic timeline for public viewing"], explanation: "Press releases from the organizations themselves are primary sources. The details are specific and realistic — Humboldt penguins really do weigh about 80 grams at birth.", teachingPoint: "Press releases from official organizations are usually reliable primary sources." },
  { id: "s4", headline: "Government Plans to Ban All Pets by 2027", body: "According to sources close to the government, a secret plan is being developed to make all pet ownership illegal by 2027. Insiders say this is part of a larger initiative that officials refuse to discuss publicly.", source: "TruthRevealed.info", isReal: false, difficulty: 3, category: "bad-source", redFlags: ["'Secret plan' with unnamed sources", "'TruthRevealed.info' is not a known news outlet", "No official statements or documents cited", "Extraordinary claim with no evidence"], explanation: "The source 'TruthRevealed.info' is not a recognized news outlet. The story relies on unnamed 'insiders' and 'secret plans' with no verifiable evidence. Legitimate policy changes are publicly announced and debated.", teachingPoint: "Unnamed 'insiders' and 'secret plans' without evidence are major red flags." },
  { id: "s5", headline: "Astronauts Complete Six-Hour Spacewalk to Repair Station", body: "Two astronauts from the International Space Station completed a successful 6-hour spacewalk yesterday to replace a faulty ammonia pump. NASA confirmed the repair was successful and the station is fully operational.", source: "NASA.gov via Reuters", isReal: true, difficulty: 3, category: "credible-report", redFlags: ["NASA is the official space agency", "Reuters is a major news agency", "Specific technical details", "Confirmation from official source"], explanation: "This cites NASA (the official space agency) through Reuters (a major news agency). The technical details are specific and verifiable. This is solid, well-sourced reporting.", teachingPoint: "Official government agencies and major news services are generally trustworthy sources." },

  // ── Difficulty 4: Emotional manipulation (Grade 5) ──
  { id: "e1", headline: "TERRIFYING: New Phone App Secretly Watches Your Children While They Sleep!", body: "Every parent needs to read this NOW! A horrifying new app is being installed on children's phones WITHOUT their knowledge. Your child could be in DANGER right this second! Share this with every parent you know!", source: "ParentAlert.net", isReal: false, difficulty: 4, category: "emotional", redFlags: ["ALL CAPS emotional words (TERRIFYING, DANGER)", "Creates panic and urgency", "No specific app named", "Urges sharing without verification"], explanation: "This story is designed to scare you into sharing it. It uses all-caps emotional words, creates false urgency ('right this second!'), and never names the actual app. Real security alerts name specific threats and come from security companies.", teachingPoint: "Stories that try to make you feel panicked or urgent may be manipulating your emotions." },
  { id: "e2", headline: "Study: Students Who Read Before Bed Score Higher on Tests", body: "A two-year study tracking 2,000 middle school students found that those who read for at least 20 minutes before bed scored 12% higher on standardized tests than non-readers. Researchers at State University controlled for other factors.", source: "Education Weekly", isReal: true, difficulty: 4, category: "credible-report", redFlags: ["Specific study details (2,000 students, 2 years)", "Modest, believable claim (12%)", "Named institution", "Mentions controlling for other factors"], explanation: "This story cites a specific study with clear numbers, a reasonable claim, and mentions scientific controls. The 12% improvement is modest and realistic, unlike the exaggerated claims in fake stories.", teachingPoint: "Trustworthy studies have specific numbers, named researchers, and modest claims." },
  { id: "e3", headline: "HEARTBREAKING: Puppies Being Used to Test Dangerous New Chemical!", body: "You'll cry when you see these photos! An anonymous whistleblower reveals that a shadowy corporation is testing toxic chemicals on adorable puppies. We must stop this NOW! Sign the petition below!", source: "AnimalDefenders.co", isReal: false, difficulty: 4, category: "emotional", redFlags: ["Emotional manipulation ('heartbreaking', 'you'll cry')", "Anonymous source", "'Shadowy corporation' — vague", "Petition links suggest activism, not journalism"], explanation: "This uses emotional manipulation: cute animals in danger, urgent calls to action, and vague accusations. Real journalism about animal welfare names specific companies and cites evidence, not just emotional language.", teachingPoint: "If a story makes you very emotional before giving you facts, question its motives." },
  { id: "e4", headline: "WARNING: Your Drinking Water Has Been POISONED and Nobody Is Telling You!", body: "The government is covering up a massive contamination of your city's water supply. Thousands are already sick but the mainstream media REFUSES to report on it. Only we are brave enough to bring you the truth!", source: "RealTruthMedia.com", isReal: false, difficulty: 4, category: "emotional", redFlags: ["Government conspiracy claim", "'Mainstream media refuses' — classic distrust tactic", "Claims to be the only source of truth", "No specific city, chemical, or evidence named"], explanation: "Real water contamination stories (like Flint, Michigan) are reported by many news outlets, not just one. This story claims to be the only source of truth and provides no specific details. Real health warnings come from health departments.", teachingPoint: "If only one website is reporting something 'everyone else is hiding,' be very suspicious." },
  { id: "e5", headline: "City Council Approves New Recycling Program Starting in March", body: "The city council voted 7-2 on Thursday to expand the curbside recycling program to include glass and electronics starting March 1. The program is expected to divert 2,000 additional tons of waste from landfills annually.", source: "Metro Times", isReal: true, difficulty: 4, category: "credible-report", redFlags: ["Specific vote count (7-2)", "Specific date and materials", "Quantified impact (2,000 tons)", "No emotional language"], explanation: "Notice how this story presents facts without trying to make you feel any particular emotion. It has specific numbers, dates, and outcomes. Good reporting informs you and lets you form your own opinion.", teachingPoint: "Good journalism informs without trying to manipulate how you feel." },

  // ── Difficulty 5: Missing context (Grade 6) ──
  { id: "m1", headline: "Crime Rate DOUBLES in City After New Policy", body: "Since the city's new community policing policy was introduced, crime statistics show the number of reported incidents has doubled from 50 to 100 in the downtown district.", source: "City Watch Report", isReal: false, difficulty: 5, category: "missing-context", redFlags: ["Doesn't mention the policy also increased reporting", "Only shows downtown numbers, not citywide", "Raw numbers without population context", "Missing time period"], explanation: "This is technically true but missing crucial context. Often when community policing is introduced, REPORTING increases (people feel safer reporting crimes) even if actual crime stays the same or decreases. The story only shows one district and gives no timeline.", teachingPoint: "A fact without context can be more misleading than a complete lie." },
  { id: "m2", headline: "Famous Athlete Says 'I Don't Care About the Fans'", body: "In an interview yesterday, star basketball player James Mitchell said, 'I don't care about the fans... I mean, I don't care about the fans who say I should retire. The real fans who support us are everything to me.'", source: "SportsTalk Daily", isReal: false, difficulty: 5, category: "missing-context", redFlags: ["Headline cuts the quote mid-sentence", "Full quote has opposite meaning", "Designed to generate outrage clicks"], explanation: "The headline takes the quote completely out of context. The full quote shows the athlete was saying the opposite of what the headline implies. This is a common trick — always read beyond the headline!", teachingPoint: "Always read the full article, not just the headline. Quotes can be cut to change meaning." },
  { id: "m3", headline: "New Research Links Coffee Consumption to Health Benefits", body: "A meta-analysis published in the Journal of Nutrition reviewed 30 studies involving over 100,000 participants. Researchers found that moderate coffee consumption (2-3 cups daily) was associated with a lower risk of certain conditions, though they note more research is needed.", source: "Journal of Nutrition Summary", isReal: true, difficulty: 5, category: "credible-report", redFlags: ["Meta-analysis (reviews many studies)", "Large sample size", "Specific and moderate claim", "Acknowledges limitations"], explanation: "This is good scientific reporting: it describes a meta-analysis (strong evidence), specifies 'moderate' consumption, says 'associated with' (not 'causes'), and notes that more research is needed. Good science is always cautious.", teachingPoint: "Good scientific reporting uses careful language like 'associated with' and 'more research needed.'" },
  { id: "m4", headline: "90% of Students Say School Is a Waste of Time", body: "A shocking new survey reveals that 9 out of 10 students think school is pointless! The survey was conducted among 10 students at a single after-school detention session.", source: "Education Insider", isReal: false, difficulty: 5, category: "missing-context", redFlags: ["Only 10 students surveyed — far too small", "Surveyed during detention — biased sample", "90% sounds impressive but is just 9 kids", "Misleading headline makes it sound larger"], explanation: "The headline makes '90%' sound like a massive survey result, but it was only 10 students — in detention! This is a textbook example of misleading statistics. A real survey would include thousands of randomly selected students.", teachingPoint: "Always check the sample size and who was surveyed. Small or biased samples mean nothing." },
  { id: "m5", headline: "International Space Station Marks 25 Years in Orbit", body: "The International Space Station celebrated 25 years of continuous human habitation this month. Over 270 astronauts from 21 countries have lived and worked aboard the station since its first crew arrived in November 2000.", source: "Space.com", isReal: true, difficulty: 5, category: "credible-report", redFlags: ["Specific verifiable facts", "Well-known source (Space.com)", "Historical record that can be checked"], explanation: "Space.com is a respected space news website. The facts about the ISS can be independently verified, and the story provides specific, accurate numbers.", teachingPoint: "Stories with specific, independently verifiable facts are usually trustworthy." },

  // ── Difficulty 6: Statistics misuse (Grade 7-8) ──
  { id: "st1", headline: "Study: People Who Eat Ice Cream Are More Likely to Drown", body: "A statistical analysis shows a strong correlation between ice cream sales and drowning deaths. In every year studied, both ice cream consumption and drowning rates peaked at the same time.", source: "Statistics Monitor", isReal: false, difficulty: 6, category: "bad-stats", redFlags: ["Confuses correlation with causation", "Missing the obvious third variable (summer/hot weather)", "Ice cream doesn't cause drowning"], explanation: "This is the classic example of 'correlation does not equal causation.' Both ice cream sales and drowning increase in summer because of hot weather, not because one causes the other. A third factor (heat) explains both.", teachingPoint: "Correlation does not mean causation. Always ask: could a third factor explain both?" },
  { id: "st2", headline: "New Medication Reduces Risk by 50% — Experts Recommend It", body: "A clinical trial shows the new medication reduces risk from 2 in 10,000 to 1 in 10,000. That's a 50% relative risk reduction! Pharmaceutical company executives call it a 'breakthrough.'", source: "Health News Wire", isReal: false, difficulty: 6, category: "bad-stats", redFlags: ["50% relative risk sounds huge but absolute risk changed by 0.01%", "From 2/10,000 to 1/10,000 is tiny", "Company executives promoting their own product"], explanation: "'50% risk reduction' sounds dramatic, but in absolute terms, the risk went from 0.02% to 0.01% — a difference of 1 in 10,000. This is the difference between relative and absolute risk, a common way statistics are used to exaggerate.", teachingPoint: "Relative risk (50% reduction) can hide tiny absolute numbers. Always check the actual numbers." },
  { id: "st3", headline: "Vaccine Study Tracks 10 Million People Over 5 Years", body: "A comprehensive study published in The Lancet followed 10 million participants across 12 countries over 5 years. Researchers found the vaccine was 94.5% effective at preventing severe disease, with serious side effects occurring in 0.002% of recipients.", source: "The Lancet", isReal: true, difficulty: 6, category: "credible-report", redFlags: ["Massive sample size (10 million)", "Published in The Lancet (top medical journal)", "Reports both benefits AND risks", "Multi-country, long-term study"], explanation: "The Lancet is one of the world's most prestigious medical journals. The study has an enormous sample size, spans multiple countries and years, and honestly reports both effectiveness and side effects. This is gold-standard research.", teachingPoint: "Trustworthy studies have large sample sizes, are published in respected journals, and report both benefits and risks." },
  { id: "st4", headline: "Graph Shows Dramatic Rise in Screen Time Problems!", body: "A viral graph shows screen-time-related issues shooting up from 2010 to 2025. But the Y-axis starts at 95% instead of 0%, making a 3% increase look like a massive spike.", source: "TechWorries.com", isReal: false, difficulty: 6, category: "bad-stats", redFlags: ["Manipulated Y-axis (not starting at 0)", "3% increase shown as dramatic", "Designed to create alarm"], explanation: "This is a classic misleading graph technique. By starting the Y-axis at 95% instead of 0%, a tiny 3% change looks like a massive spike. Always check the scale on graphs — this trick is very common.", teachingPoint: "Always check the scale on graphs. A Y-axis that doesn't start at 0 can make small changes look huge." },

  // ── Difficulty 7: Logical fallacies (Grade 9-10) ──
  { id: "l1", headline: "Famous Actor Endorses New Learning App — 'It Changed My Life!'", body: "Award-winning actor Alex Rivera says StudyPro is 'the best educational tool ever created.' If one of the world's most successful people uses it, shouldn't your child?", source: "StudyPro Marketing", isReal: false, difficulty: 7, category: "logical-fallacy", redFlags: ["Appeal to authority — actor is not an education expert", "Celebrity endorsement is marketing, not evidence", "Being famous doesn't make someone an expert on education"], explanation: "This is an 'appeal to authority' fallacy. Being a famous actor doesn't make someone an expert on education. Celebrity endorsements are paid marketing, not evidence that a product works. Look for endorsements from actual education researchers.", teachingPoint: "Famous people aren't experts on everything. Look for evidence from actual experts in the field." },
  { id: "l2", headline: "Critic of Space Program Doesn't Even Have a Science Degree!", body: "Senator Williams voted to cut the space budget, but did you know she majored in political science, not actual science? How can someone without a 'real' science degree make decisions about space exploration?", source: "SpaceFans Forum", isReal: false, difficulty: 7, category: "logical-fallacy", redFlags: ["Ad hominem attack — attacks the person, not the argument", "Politicians make budget decisions, not scientific ones", "Implies only scientists can have valid opinions on policy"], explanation: "This is an 'ad hominem' fallacy — attacking the person instead of their argument. Budget decisions are about policy priorities, not science expertise. The senator's degree doesn't make her budget argument right or wrong.", teachingPoint: "Ad hominem attacks the person instead of addressing their argument. The argument itself is what matters." },
  { id: "l3", headline: "Either We Ban All Social Media or Our Kids Are Doomed", body: "The only way to protect children from online dangers is a complete ban on all social media for anyone under 18. There is no middle ground — you either support the ban or you don't care about children.", source: "Digital Safety Alliance Blog", isReal: false, difficulty: 7, category: "logical-fallacy", redFlags: ["False dilemma — only two extreme options presented", "Many middle-ground options exist (supervision, age-appropriate limits)", "'You don't care about children' is emotional manipulation"], explanation: "This is a 'false dilemma' (or 'either/or') fallacy. It presents only two extreme options when many middle-ground solutions exist (parental controls, age limits, digital literacy education). Real policy discussions consider a range of options.", teachingPoint: "False dilemma presents only two extreme options. Real solutions usually involve a range of possibilities." },
  { id: "l4", headline: "Peer-Reviewed Study Questions Common Assumption About Learning Styles", body: "A meta-analysis published in Psychological Science in the Public Interest found limited evidence that matching teaching methods to students' preferred learning styles (visual, auditory, kinesthetic) actually improves outcomes, challenging a widely held belief.", source: "American Psychological Association", isReal: true, difficulty: 7, category: "credible-report", redFlags: ["Published by APA (respected authority)", "Challenges popular belief with evidence", "Uses careful language ('limited evidence')", "Peer-reviewed meta-analysis"], explanation: "This is real and is a good example of how science can challenge popular beliefs. The APA is a respected organization, the research is peer-reviewed, and the language is careful and measured. Good science goes where the evidence leads.", teachingPoint: "Good science sometimes challenges popular beliefs. That's how knowledge improves." },

  // ── Difficulty 8: Sophisticated (Grade 11+) ──
  { id: "p1", headline: "Thousands of Experts Sign Letter Supporting New Energy Policy", body: "Over 5,000 'energy experts' have signed an open letter supporting the controversial GridMax energy proposal. Investigation reveals that signatories include dentists, retired engineers from unrelated fields, and several fictional names.", source: "Energy Policy Review", isReal: false, difficulty: 8, category: "propaganda", redFlags: ["'Experts' are from unrelated fields", "Manufactured consensus — quantity over quality", "Fictional names among signatories", "Uses number to create false sense of agreement"], explanation: "This is 'manufactured consensus' — using large numbers of loosely qualified or fake 'experts' to create the illusion of scientific agreement. Real expert consensus comes from peer-reviewed research by actual specialists in the field.", teachingPoint: "Manufactured consensus uses large numbers of unqualified or fake 'experts.' Check who actually signed." },
  { id: "p2", headline: "Multiple Independent Reviews Question Product Safety", body: "A consumer investigation found that 15 'independent' review blogs praising the health supplement NutriMax were all registered to the same holding company that manufactures the product. Each blog used similar writing patterns and stock photos.", source: "Consumer Reports Investigation", isReal: true, difficulty: 8, category: "credible-report", redFlags: ["Investigative journalism exposing astroturfing", "Specific, verifiable claims", "Consumer Reports is a trusted source"], explanation: "This is real investigative journalism exposing 'astroturfing' — when a company creates fake grassroots support. Consumer Reports is a well-respected independent organization known for thorough investigations.", teachingPoint: "Astroturfing creates fake 'independent' support. Check if 'independent' reviewers are truly independent." },
  { id: "p3", headline: "Report: Social Media Platform Amplifies Extreme Views Over Moderate Ones", body: "An internal company report leaked to journalists shows that the platform's algorithm was redesigned in 2024 to prioritize 'engagement' — which in practice means promoting outrage and conflict because they generate more clicks and time spent on the app.", source: "Tech Transparency Project", isReal: true, difficulty: 8, category: "credible-report", redFlags: ["Based on leaked internal document", "Specific mechanism described", "Known issue in tech industry", "Reputable transparency organization"], explanation: "This reflects real, well-documented concerns about social media algorithms. The Tech Transparency Project is a real research organization, and similar stories have been verified by major outlets about several platforms.", teachingPoint: "Social media algorithms can amplify extreme content because outrage drives engagement." },
  { id: "p4", headline: "New Study Funded by Industry Group Finds Their Product Perfectly Safe", body: "A study funded by the National Sweetener Association concludes that their artificial sweetener has absolutely no health risks. The study contradicts three independent university studies that found potential concerns.", source: "National Sweetener Association Press Release", isReal: false, difficulty: 8, category: "propaganda", redFlags: ["Funded by the industry being studied", "Contradicts multiple independent studies", "'Absolutely no risk' is unusually strong scientific language", "Press release, not peer-reviewed journal"], explanation: "Industry-funded research often reaches conclusions favorable to the funder. When one industry-funded study contradicts multiple independent studies, the conflict of interest is a major red flag. Real science acknowledges uncertainty.", teachingPoint: "Always check who funded a study. Industry-funded research may have conflicts of interest." },

  // ── Additional stories for variety ──
  { id: "a1", headline: "School Lunch Menu to Include More Fresh Vegetables Next Semester", body: "Following a nutrition audit, the school board approved a plan to replace processed sides with locally sourced vegetables starting in January. The pilot program will begin in five elementary schools.", source: "School Board Minutes", isReal: true, difficulty: 2, category: "credible-report", redFlags: ["Official source (school board)", "Specific timeline and scope", "Reasonable, common policy change"], explanation: "School board minutes are official public records. The change described is common, specific, and reasonable. This is reliable primary-source reporting.", teachingPoint: "Official public records like board minutes are primary sources you can trust." },
  { id: "a2", headline: "Shocking! WiFi Signals Are Secretly Changing Your DNA!!", body: "Scientists from the Global Institute of Electromagnetic Research have discovered that WiFi signals can rewrite your genetic code, causing mutations! Share this before it gets taken down!", source: "WakeUpWorld.net", isReal: false, difficulty: 4, category: "emotional", redFlags: ["Non-existent institute", "WiFi signals are non-ionizing and cannot change DNA", "Urgency to share ('before it gets taken down')", "Multiple exclamation marks"], explanation: "WiFi uses non-ionizing radiation that does not have enough energy to damage DNA. The 'Global Institute of Electromagnetic Research' doesn't exist. The urgency to share 'before it gets taken down' is a common manipulation tactic.", teachingPoint: "Urgency to share 'before it's deleted' is a manipulation tactic. Real science isn't suppressed that easily." },
  { id: "a3", headline: "Survey: 73% of Teachers Support Extended Recess Time", body: "A nationwide survey of 15,000 K-5 teachers by the National Education Association found that 73% support increasing daily recess to at least 30 minutes, citing improved focus and behavior in afternoon classes.", source: "National Education Association", isReal: true, difficulty: 5, category: "credible-report", redFlags: ["Large sample size (15,000)", "Known organization (NEA)", "Specific and moderate percentage", "Cites reasoning"], explanation: "The NEA is a real, well-known organization. The survey has a large sample size and the results are specific and reasonable. The story explains the reasoning behind teachers' support.", teachingPoint: "Large surveys from known organizations with specific results are generally reliable." },
  { id: "a4", headline: "Ancient Civilization Discovered Under Local Shopping Mall", body: "Construction workers at Riverside Mall claim they uncovered ruins of a 5,000-year-old advanced civilization with technology more advanced than ours. No archaeologists have been allowed to examine the site.", source: "MysteryUncovered.com", isReal: false, difficulty: 3, category: "bad-source", redFlags: ["Claims of civilization 'more advanced than ours'", "No expert verification", "'Not allowed to examine' suggests conspiracy", "Unreliable source website"], explanation: "Real archaeological discoveries are examined by archaeologists and reported through academic channels. The claim that no experts are 'allowed' to examine it suggests a conspiracy, and 'MysteryUncovered.com' is not a credible source.", teachingPoint: "Real discoveries are studied by experts and published in academic journals, not conspiracy websites." },
  { id: "a5", headline: "First: After Rain of Complaints, App Removes Feature", body: "After over 50,000 user complaints and a petition with 200,000 signatures, the popular app SocialSpace announced it will remove its controversial auto-sharing feature. The company's CEO issued a public apology.", source: "TechCrunch", isReal: true, difficulty: 6, category: "credible-report", redFlags: ["Known tech news source (TechCrunch)", "Specific numbers", "Company response documented", "Common type of tech news"], explanation: "TechCrunch is a well-known technology news outlet. The story has specific numbers, documents both the problem and the response, and describes a type of event that regularly happens in the tech industry.", teachingPoint: "Established tech news outlets with specific details and documented responses are trustworthy." },
  { id: "a6", headline: "Everyone Who Disagrees With This Policy Clearly Hates Children", body: "The new education bill has been criticized by some parents, but anyone opposing it obviously doesn't care about their children's future. Only someone who wants kids to fail would oppose more testing.", source: "Education First Blog", isReal: false, difficulty: 7, category: "logical-fallacy", redFlags: ["Straw man fallacy — misrepresents opponents' position", "Emotional manipulation", "Assumes motives of critics", "Black-and-white thinking"], explanation: "This is a 'straw man' fallacy — it misrepresents the opponents' position. Critics may have valid educational concerns about over-testing. Claiming they 'hate children' is both inaccurate and manipulative.", teachingPoint: "A straw man fallacy misrepresents the opposing argument to make it easier to attack." },
  { id: "a7", headline: "My Grandma Smoked Her Whole Life and Lived to 95, So Smoking Must Be Safe", body: "An op-ed argues that since the author's grandmother smoked for 70 years without health problems, warnings about smoking are overblown. 'If it were really dangerous, she would have gotten sick,' the author writes.", source: "LifestyleOpinions.com", isReal: false, difficulty: 7, category: "logical-fallacy", redFlags: ["Anecdotal evidence fallacy", "One person's experience doesn't disprove scientific evidence", "Ignores millions of counter-examples"], explanation: "This is the 'anecdotal evidence' fallacy. One person's experience doesn't override mountains of scientific evidence. Some people do survive despite risks, but that doesn't make the activity safe for everyone.", teachingPoint: "One personal story doesn't disprove scientific evidence based on millions of cases." },
  { id: "a8", headline: "Researchers Find New Species of Deep-Sea Fish Near Hydrothermal Vents", body: "Marine biologists from Woods Hole Oceanographic Institution discovered a previously unknown species of anglerfish at 3,200 meters depth near a hydrothermal vent in the Mid-Atlantic Ridge. The species has been named Melanocetus oceanfloor.", source: "Nature Journal", isReal: true, difficulty: 6, category: "credible-report", redFlags: ["Published in Nature (top scientific journal)", "Named real institution (Woods Hole)", "Specific depth and location", "Latin species name follows naming conventions"], explanation: "Nature is one of the most prestigious scientific journals. Woods Hole is a real and respected oceanographic institution. The details (depth, location, species naming convention) are all consistent with real scientific discovery.", teachingPoint: "Top scientific journals like Nature have rigorous peer review — their articles are highly trustworthy." },
  { id: "a9", headline: "Three Out of Four Dentists Recommend This Toothpaste", body: "An ad claims that 75% of dentists recommend BrightSmile toothpaste, but the fine print reveals they surveyed only 4 dentists who were paid consultants for the company.", source: "BrightSmile Advertisement", isReal: false, difficulty: 6, category: "bad-stats", redFlags: ["Only 4 dentists surveyed", "Paid consultants — conflict of interest", "75% sounds impressive but is 3 people", "Fine print hides the real story"], explanation: "This classic advertising trick makes '3 out of 4 dentists' sound like a massive endorsement, but it's literally just 3 paid consultants. Always check the fine print and sample size behind statistics.", teachingPoint: "Impressive-sounding percentages can hide tiny, biased sample sizes. Always check the fine print." },
  { id: "a10", headline: "Climate Report Based on 40 Years of Satellite Data Shows Warming Trend", body: "NOAA's latest climate report, compiled from 40 years of continuous satellite measurements and verified by research teams in 14 countries, documents a consistent warming trend of 0.18°C per decade. The data is publicly available for independent verification.", source: "NOAA Climate Report", isReal: true, difficulty: 8, category: "credible-report", redFlags: ["Government agency (NOAA)", "40 years of data", "Verified by multiple countries", "Data publicly available", "Specific measurement cited"], explanation: "This has all the hallmarks of trustworthy science: long-term data, multiple independent verifications, a government agency source, and publicly available data anyone can check. Transparency is key.", teachingPoint: "The most trustworthy research uses long-term data, multiple verifications, and makes data publicly available." },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

const GAME_ID = "fake-news-detective";
const STORIES_PER_GAME = 12;
const COUNTDOWN_SECS = 3;

function difficultyForLevel(level: number): number {
  if (level <= 5) return 1;
  if (level <= 10) return 2;
  if (level <= 14) return 3;
  if (level <= 18) return 4;
  if (level <= 25) return 5;
  if (level <= 32) return 6;
  if (level <= 40) return 7;
  return 8;
}

function pickStories(level: number): NewsStory[] {
  const target = difficultyForLevel(level);
  // Pick stories at or near the target difficulty, with a small range
  const eligible = STORIES.filter(s => Math.abs(s.difficulty - target) <= 1);
  // Shuffle and pick
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, STORIES_PER_GAME);
}

function getReasonOptions(story: NewsStory): { text: string; correct: boolean }[] {
  const correct = story.redFlags[0];
  // Generate plausible wrong reasons
  const wrongReasons = story.isReal
    ? [
        "The headline uses all-caps emotional words",
        "The source website doesn't exist",
        "The story contradicts known science",
      ]
    : [
        "The story was published by a trusted news outlet",
        "The facts are specific and verifiable",
        "Multiple independent sources confirm this",
      ];

  const options = [
    { text: correct, correct: true },
    ...wrongReasons.slice(0, 3).map(r => ({ text: r, correct: false })),
  ];
  return options.sort(() => Math.random() - 0.5);
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    "impossible-claim": "Impossible Claims",
    "clickbait": "Clickbait Detection",
    "bad-source": "Source Checking",
    "emotional": "Emotional Manipulation",
    "missing-context": "Missing Context",
    "bad-stats": "Statistics Misuse",
    "logical-fallacy": "Logical Fallacies",
    "propaganda": "Propaganda Techniques",
    "credible-report": "Credible Reporting",
  };
  return map[cat] || cat;
}

/* ─── Component ──────────────────────────────────────────────────── */

export function FakeNewsDetectiveGame() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [adaptive, setAdaptive] = useState<AdaptiveState>(() => createAdaptiveState(1));
  const [stories, setStories] = useState<NewsStory[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [calledReal, setCalledReal] = useState<boolean | null>(null);
  const [reasonOptions, setReasonOptions] = useState<{ text: string; correct: boolean }[]>([]);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [highScore, setHighScoreState] = useState(0);
  const [medals, setMedals] = useState<NewAchievement[]>([]);
  const [adjustAnim, setAdjustAnim] = useState<"up" | "down" | null>(null);
  const roundStartRef = useRef(Date.now());

  useGameMusic();

  // Load high score
  useEffect(() => {
    setHighScoreState(getLocalHighScore(GAME_ID));
  }, []);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      sfxCountdownGo();
      const picked = pickStories(adaptive.level);
      setStories(picked);
      setCurrentIdx(0);
      setPhase("playing-story");
      roundStartRef.current = Date.now();
      return;
    }
    sfxCountdown();
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown, adaptive.level]);

  // Start game
  const startGame = useCallback((startLevel: number) => {
    setAdaptive(createAdaptiveState(startLevel));
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setResults([]);
    setCurrentIdx(0);
    setCalledReal(null);
    setSelectedReason(null);
    setCountdown(COUNTDOWN_SECS);
    setPhase("countdown");
  }, []);

  const story = stories[currentIdx];

  // Handle REAL/FAKE choice
  const handleVerdict = useCallback((verdict: boolean) => {
    if (!story) return;
    setCalledReal(verdict);
    setReasonOptions(getReasonOptions(story));
    setPhase("playing-reason");
  }, [story]);

  // Handle reason choice
  const handleReason = useCallback((idx: number) => {
    if (!story || selectedReason !== null) return;
    setSelectedReason(idx);

    const verdictCorrect = (calledReal === story.isReal);
    const reasonCorrect = reasonOptions[idx].correct;
    const elapsed = Date.now() - roundStartRef.current;
    const fast = elapsed < 10000; // < 10 seconds

    const bothCorrect = verdictCorrect && reasonCorrect;
    const partialCorrect = verdictCorrect && !reasonCorrect;

    // Points
    const { mult } = getMultiplierFromStreak(streak);
    let pts = 0;
    if (bothCorrect) {
      pts = Math.round((fast ? 150 : 100) * mult);
      sfxCorrect();
    } else if (partialCorrect) {
      pts = Math.round(50 * mult);
      sfxCorrect();
    } else {
      if (streak > 0) sfxStreakLost();
      sfxWrong();
    }

    const newScore = score + pts;
    setScore(newScore);

    // Streak
    const newStreak = bothCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    if (newStreak > maxStreak) setMaxStreak(newStreak);
    if (newStreak > 0 && newStreak % 5 === 0) sfxCombo(newStreak);

    // Adaptive
    const newAdaptive = adaptiveUpdate(
      adaptive,
      verdictCorrect,
      fast && bothCorrect,
    );
    setAdaptive(newAdaptive);
    if (newAdaptive.lastAdjust && newAdaptive.lastAdjustTime > adaptive.lastAdjustTime) {
      setAdjustAnim(newAdaptive.lastAdjust);
      setTimeout(() => setAdjustAnim(null), 1200);
      if (newAdaptive.lastAdjust === "up") sfxLevelUp();
    }

    // Record result
    setResults(prev => [...prev, {
      story,
      calledReal: calledReal!,
      reasonCorrect,
      correct: verdictCorrect,
      fast,
    }]);

    // Show explanation
    setPhase("reveal");
  }, [story, selectedReason, calledReal, reasonOptions, score, streak, maxStreak, adaptive]);

  // Next story
  const nextStory = useCallback(() => {
    if (currentIdx + 1 >= stories.length) {
      // Game over
      const finalScore = score;
      if (finalScore > highScore) {
        setLocalHighScore(GAME_ID, finalScore);
        setHighScoreState(finalScore);
      }
      const profile = getProfile();
      const correctCount = results.filter(r => r.correct).length;
      const gameStats = {
        gameId: GAME_ID,
        score: finalScore,
        bestStreak: maxStreak,
        bestCombo: maxStreak,
        accuracy: Math.round(correctCount / Math.max(1, results.length) * 100),
        perfectLevels: correctCount === results.length ? 1 : 0,
      };
      const gamesPlayedByGameId = profile?.gamesPlayedByGameId ?? {};
      const totalPlayed = profile?.totalGamesPlayed ?? 0;
      const newMedals = checkAchievements(gameStats, totalPlayed, gamesPlayedByGameId);
      setMedals(newMedals);
      if (newMedals.length > 0) sfxAchievement();
      trackGamePlayed(GAME_ID, finalScore, { bestStreak: maxStreak, adaptiveLevel: Math.round(adaptive.level) });
      const acc = results.length > 0 ? correctCount / results.length : 0;
      if (acc >= 1.0) sfxPerfect();
      else if (acc >= 0.8) sfxLevelUp();
      else sfxGameOver();
      setPhase("complete");
    } else {
      setCurrentIdx(i => i + 1);
      setCalledReal(null);
      setSelectedReason(null);
      setReasonOptions([]);
      roundStartRef.current = Date.now();
      setPhase("playing-story");
    }
  }, [currentIdx, stories.length, score, highScore, maxStreak, results, adaptive]);

  const dl = getDifficultyLabel(adaptive.level);
  const gradeInfo = getGradeForLevel(adaptive.level);
  const accuracy = results.length > 0 ? Math.round(results.filter(r => r.correct).length / results.length * 100) : 0;

  // ── MENU ──
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-2xl font-bold">Fake News Detective</h1>
          <AudioToggles />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-lg mx-auto gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-3xl font-extrabold mb-2">Can You Spot the Fakes?</h2>
            <p className="text-white/60 text-sm">Learn to identify misinformation, clickbait, and logical fallacies. Become a media literacy expert!</p>
          </div>

          <div className="w-full bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-bold text-amber-400 mb-2">Skills You&apos;ll Learn</h3>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-white/70">
              <div>🟢 Spot impossible claims</div>
              <div>🟡 Detect clickbait</div>
              <div>🟠 Check sources</div>
              <div>🔴 Resist emotional tricks</div>
              <div>💥 Catch missing context</div>
              <div>🔥 Analyze statistics</div>
              <div>⚡ Find logical fallacies</div>
              <div>👑 Identify propaganda</div>
            </div>
          </div>

          <div className="w-full space-y-2">
            <p className="text-xs text-white/40 text-center">Choose starting level</p>
            {[
              { label: "Grade 3-4", desc: "Obvious fakes & clickbait", level: 1, color: "#22c55e" },
              { label: "Grade 5-6", desc: "Sources & emotional tricks", level: 11, color: "#eab308" },
              { label: "Grade 7-8", desc: "Stats & missing context", level: 26, color: "#ef4444" },
              { label: "Grade 9+", desc: "Fallacies & propaganda", level: 33, color: "#a855f7" },
            ].map(opt => (
              <button
                key={opt.level}
                onClick={() => startGame(opt.level)}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-between hover:scale-[1.02] transition-transform"
                style={{ backgroundColor: opt.color + "22", border: `1px solid ${opt.color}44` }}
              >
                <span>{opt.label}</span>
                <span className="text-white/50 text-xs font-normal">{opt.desc}</span>
              </button>
            ))}
          </div>

          {highScore > 0 && (
            <p className="text-xs text-white/40">Personal best: {highScore.toLocaleString()}</p>
          )}
        </div>
      </div>
    );
  }

  // ── COUNTDOWN ──
  if (phase === "countdown") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-black tabular-nums animate-pulse">{countdown || "GO!"}</div>
          <p className="text-white/40 mt-2">Get ready to investigate...</p>
        </div>
      </div>
    );
  }

  // ── HUD ──
  const HUD = (
    <div className="p-3 flex items-center justify-between bg-black/30 text-sm">
      <div className="flex items-center gap-2">
        <Link href="/games" className="text-white/40 hover:text-white"><ArrowLeft size={18} /></Link>
        <Shield size={16} className="text-amber-400" />
        <span className="font-bold">{score.toLocaleString()}</span>
        {streak >= 3 && <StreakBadge streak={streak} />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
        <span className="text-xs text-white/50">Lvl {Math.round(adaptive.level)} · {gradeInfo.label}</span>
        {adjustAnim && (
          <span className={`text-xs font-bold animate-bounce ${adjustAnim === "up" ? "text-green-400" : "text-red-400"}`}>
            {adjustAnim === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>
      <div className="text-xs text-white/40">
        {currentIdx + 1}/{stories.length}
      </div>
    </div>
  );

  // ── PLAYING: Show Story ──
  if (phase === "playing-story" && story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
          {/* News card */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 px-4 py-2 flex items-center gap-2 text-xs text-white/50">
              <Search size={12} />
              <span className="font-mono">{story.source}</span>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-extrabold leading-tight mb-3">{story.headline}</h2>
              <p className="text-white/70 text-sm leading-relaxed">{story.body}</p>
            </div>
          </div>

          <p className="text-white/40 text-xs mt-4 mb-2">Is this story real or fake?</p>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleVerdict(true)}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/40 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} /> REAL
            </button>
            <button
              onClick={() => handleVerdict(false)}
              className="flex-1 py-4 rounded-xl font-bold text-lg bg-red-600/20 border border-red-500/40 hover:bg-red-600/40 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={20} /> FAKE
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING: Pick Reason ──
  if (phase === "playing-reason" && story) {
    const verdictCorrect = calledReal === story.isReal;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
          {/* Verdict feedback */}
          <div className={`w-full rounded-xl p-3 mb-4 text-center text-sm font-bold ${verdictCorrect ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400" : "bg-red-600/20 border border-red-500/30 text-red-400"}`}>
            {verdictCorrect
              ? `Correct! This story is ${story.isReal ? "REAL" : "FAKE"}.`
              : `Not quite — this story is actually ${story.isReal ? "REAL" : "FAKE"}.`}
          </div>

          <p className="text-white/60 text-sm mb-3">
            {story.isReal ? "Why is this story credible?" : "What's the main red flag?"}
          </p>

          <div className="w-full space-y-2">
            {reasonOptions.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleReason(i)}
                disabled={selectedReason !== null}
                className={`w-full py-3 px-4 rounded-xl text-sm text-left transition-all ${
                  selectedReason === null
                    ? "bg-white/5 border border-white/10 hover:bg-white/10"
                    : selectedReason === i
                      ? opt.correct
                        ? "bg-emerald-600/30 border border-emerald-500/40"
                        : "bg-red-600/30 border border-red-500/40"
                      : opt.correct
                        ? "bg-emerald-600/20 border border-emerald-500/30"
                        : "bg-white/5 border border-white/10 opacity-50"
                }`}
              >
                {opt.text}
                {selectedReason !== null && opt.correct && (
                  <span className="ml-2 text-emerald-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── REVEAL ──
  if (phase === "reveal" && story) {
    const lastResult = results[results.length - 1];
    const pts = lastResult?.correct
      ? lastResult.reasonCorrect
        ? lastResult.fast ? 150 : 100
        : 50
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
        {HUD}
        <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-xl mx-auto">
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye size={16} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase">{categoryLabel(story.category)}</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed mb-3">{story.explanation}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-400 mb-1">Key Lesson</p>
              <p className="text-sm text-white/90">{story.teachingPoint}</p>
            </div>
          </div>

          {pts > 0 && (
            <p className="text-emerald-400 font-bold text-sm mb-3">+{pts} points</p>
          )}

          <button
            onClick={nextStory}
            className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            {currentIdx + 1 >= stories.length ? "See Results" : "Next Story →"}
          </button>
        </div>
      </div>
    );
  }

  // ── COMPLETE ──
  if (phase === "complete") {
    const correct = results.filter(r => r.correct).length;
    const reasonsCorrect = results.filter(r => r.reasonCorrect).length;
    const categoriesCorrect = new Set(results.filter(r => r.correct).map(r => r.story.category));
    const categoriesWrong = new Set(results.filter(r => !r.correct).map(r => r.story.category));
    const skillsMastered = [...categoriesCorrect].filter(c => !categoriesWrong.has(c));
    const skillsToWork = [...categoriesWrong];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3">
          <Link href="/games" className="text-white/60 hover:text-white"><ArrowLeft size={24} /></Link>
          <h1 className="text-xl font-bold">Investigation Complete</h1>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 max-w-lg mx-auto gap-4">
          <div className="text-center">
            <Trophy size={48} className="text-amber-400 mx-auto mb-2" />
            <div className="text-4xl font-black">{score.toLocaleString()}</div>
            <p className="text-white/40 text-sm">Detective Score</p>
            {score > highScore && score > 0 && (
              <p className="text-amber-400 text-xs font-bold mt-1">New Personal Best!</p>
            )}
          </div>

          <div className="w-full grid grid-cols-3 gap-3">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{correct}/{results.length}</div>
              <p className="text-xs text-white/40">Correct</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{accuracy}%</div>
              <p className="text-xs text-white/40">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold">{maxStreak}</div>
              <p className="text-xs text-white/40">Best Streak</p>
            </div>
          </div>

          <div className="w-full bg-white/5 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/40">Difficulty Reached</span>
              <span className="font-bold" style={{ color: dl.color }}>{dl.emoji} {dl.label}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">Grade Level</span>
              <span className="font-bold">{gradeInfo.label} · Lvl {Math.round(adaptive.level)}</span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-white/40">Reasoning Accuracy</span>
              <span className="font-bold">{results.length > 0 ? Math.round(reasonsCorrect / results.length * 100) : 0}%</span>
            </div>
          </div>

          {skillsMastered.length > 0 && (
            <div className="w-full bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-emerald-400 mb-1">Skills Mastered</p>
              <div className="flex flex-wrap gap-1.5">
                {skillsMastered.map(c => (
                  <span key={c} className="text-xs bg-emerald-600/20 text-emerald-300 px-2 py-0.5 rounded">{categoryLabel(c)}</span>
                ))}
              </div>
            </div>
          )}

          {skillsToWork.length > 0 && (
            <div className="w-full bg-amber-600/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-400 mb-1">Keep Practicing</p>
              <div className="flex flex-wrap gap-1.5">
                {skillsToWork.map(c => (
                  <span key={c} className="text-xs bg-amber-600/20 text-amber-300 px-2 py-0.5 rounded">{categoryLabel(c)}</span>
                ))}
              </div>
            </div>
          )}

          <ScoreSubmit
            game={GAME_ID}
            score={score}
            level={Math.round(adaptive.level)}
            stats={{
              streak: maxStreak,
              accuracy: results.length > 0 ? Math.round(correct / results.length * 100) : 0,
              stories: results.length,
              reasoning: reasonsCorrect,
            }}
          />

          {medals.length > 0 && (
            <AchievementToast
              name={medals[0].name}
              tier={medals[0].tier}
              onDismiss={() => setMedals([])}
            />
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => startGame(adaptive.level)}
              className="flex-1 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 transition flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} /> Play Again
            </button>
            <Link href="/games" className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition text-center">
              All Games
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // fallback
  return null;
}
