

import { create } from 'zustand'
 
const sceneStates = {
  Transformation:{
    realm:'Body Realm',
    phrase:'"The body enters its transformation."',
    when:['when your posture speaks for you','when discipline feels like freedom','when the body leads before the voice','when you train for clarity, not applause','when heat sharpens your presence']
  },
  Expansion:{
    realm:'Body Realm',
    phrase:'"The body moves to remember freedom."',
    when:['when movement becomes the answer','when you stretch past the thought','when the body knows before the mind does','when rest is earned not given','when you inhabit every step']
  },
  Momentum:{
    realm:'Body Realm',
    phrase:'"The body remembers the sun."',
    when:['when warmth is your natural state','when you carry summer inward','when the skin remembers what the mind forgot','when presence is physical','when you are the heat in the room']
  },
  Clarity:{
    realm:'Mind Realm',
    phrase:'"The mind listens before it speaks."',
    when:['when silence is your first response','when you hear what is underneath the words','when patience becomes intelligence','when you wait for the full picture','when observation is your power']
  },
  Innovation:{
    realm:'Mind Realm',
    phrase:'"The mind connects what others can\'t see."',
    when:['when patterns appear where others see noise','when you think three moves ahead','when solitude sharpens your vision','when synthesis is effortless','when you hold complexity lightly']
  },
  Imagination:{
    realm:'Mind Realm',
    phrase:'"The mind breathes light."',
    when:['when clarity arrives without effort','when the answer comes in stillness','when you think from a place of calm','when the mind is clean and ready','when understanding feels like air']
  },
  Truth:{
    realm:'Heart Realm',
    phrase:'"The heart chooses truth."',
    when:['when you say what cannot be unsaid','when love requires courage','when you stay when it would be easier to leave','when you choose depth over distance','when the heart leads and the mind follows'],
    note:'This state recommended for women.'
  }
}
 
const sunMoonData = {
  sun: {
    label: 'Liquid Gold · Sun',
    not: 'Not a state selection. A maintenance layer.',
    main: '"The art of creation in motion."',
    product: 'A single drop. The entire day. Pure Aged Oud.',
    primer: 'Balance Collection acts as a primer. It stabilizes the state and enhances how fragrance wears.',
  },
  moon: {
    label: 'Second Skin · Moon',
    not: 'Not a state selection. A maintenance layer.',
    main: '"The art of creation in stillness."',
    product: 'Your skin, amplified. Pure Musk.',
    primer: 'Balance Collection acts as a primer. It stabilizes the state and enhances how fragrance wears.',
  },
}
 
const useSceneStore = create((set) => ({
  states: sceneStates,
  sunMoonData,
 
  hoveredState: null,
  setHoveredState: (key) => set({ hoveredState: key }),
 
  activeState: null,
  openModal:  (key) => set({ activeState: key }),
  closeModal: ()    => set({ activeState: null }),
 // add inside create((set) => ({
activeHorizon: false,
openHorizonModal:  () => set({ activeHorizon: true }),
closeHorizonModal: () => set({ activeHorizon: false }),
  // sun / moon modal
  activeSunMoon: null,
  openSunMoonModal:  (type) => set({ activeSunMoon: type }),   // 'sun' | 'moon'
  closeSunMoonModal: ()     => set({ activeSunMoon: null }),
}))
 
export default useSceneStore