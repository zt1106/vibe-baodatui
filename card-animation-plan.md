# Implementing Card Animations for the vibe‑baodatui Poker UI

## 1 Current implementation in **vibe‑baodatui**

The existing UI for playing cards in the vibe‑baodatui monorepo consists of several React components.

### PlayingCard component

- PlayingCard is a **React component** used by the web app. It accepts a card object and renders either the card face or back using small sub‑components. Basic interactivity (selectable/highlighted/disabled) is supported.
- The component renders a &lt;div&gt; and uses CSS variables (card width/height, etc.) to size the card. It applies CSS transitions for _filter_, _box‑shadow_ and _transform_ when properties such as selected or tiltDeg change. There is no dedicated animation library - transforms are static.
- The card container sets perspective: 1200px and uses an optional tiltDeg prop to rotate the card. When selected, the card is slightly raised and scaled (translateY(-6px) scale(1.04)). The transition property only affects minor state changes, not full movement across the screen[\[1\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx#L160-L182).

### CardRow component

- CardRow receives an array of Card objects and lays them out horizontally. It calls computeRowLayout() (from cardLayout.ts) to calculate an (x,y, rotateDeg, zIndex) transform for each card based on the number of cards, overlap percentage, curve offset and angle.
- Each card is wrapped in an absolutely‑positioned &lt;div&gt; that uses the computed translation and rotation values and sets CSS transition: transform 150ms ease, filter 150ms ease[\[2\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx#L171-L182). When cards are added/removed, the new positions are calculated but the component does not animate the cards to their new locations - the transform property jumps to the new values immediately.
- There is no built‑in animation for moving cards into or out of the row. Selecting a card only applies a small translation and scale; drawing or discarding is instantaneous.

### CardStack (deck) component

- CardStack displays a stack of face‑down cards with up to three visible layers. It shows an optional top card (topCard) and a "draw" button. The deck is rendered using a handful of &lt;div&gt; elements that are offset by a small amount to simulate depth. There are no animations when drawing a card.

### Overall architecture

- The codebase uses **React**, **TypeScript**, and Tailwind/vanilla CSS. There is no dedicated animation library in the UI layer.
- Cards are represented by an interface Card (id, rank, suit, faceUp, meta)[\[3\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/core-cards/src/types.ts#L15-L21). Layout calculations are performed using pure functions (computeRowLayout) and passed down as inline styles. The game logic lives in packages/game-core, separate from UI.

## 2 Public examples of animated card UIs

### React‑Poker

- An open‑source library called **react‑poker** provides high‑level card animations. Its documentation states that it uses **react‑motion** internally to animate dealing cards: "_Internally react motion is used to animate card deals when the board prop changes_"[\[4\]](https://github.com/therewillbecode/react-poker#:~:text=and%20facing%20up%20on%20the,community%20board). The Deck component accepts a board array and animates cards being dealt to the board.

### Framer Motion & card stacks

- Several demos in the Framer ecosystem show interactive card stacks. The **Card Stack** component on Framer's marketplace allows users to swipe through a stack of images. It highlights that the top card moves to the back of the stack when dragged and that designers can customise spacing, scale, dimming and animation feel (e.g., spring stiffness and damping)[\[5\]](https://www.framer.com/marketplace/components/card-stack/#:~:text=Swipe%20through%20a%20stack%20of,intros%2C%20or%20playful%20UI%20moments).
- A tutorial on **GSAP** and **Draggable** describes how to animate a deck of cards in React. It splits the component into the deck, navigation buttons and main container and uses GSAP and the Draggable plugin for drag effects[\[6\]](https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919#:~:text=The%20Stack). The code example sets each card's z‑index, rotates it slightly based on its position and uses the GSAP to and fromTo functions to animate rotation, scale and position. When a card is dragged and dropped beyond a threshold, it animates back to the origin and then moves to the back of the deck using a function animateToBackOfDeck() which animates x, y, scale and rotation over 0.35 seconds[\[7\]](https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919#:~:text=const%20,).

These examples demonstrate two common approaches: **react‑motion/Framer Motion** (declarative, physics‑based animations integrated with React) and **GSAP** (imperative, highly controllable animations). Framer Motion's layout and layoutId features support automatic FLIP‑style animations across different containers, which is particularly useful for moving cards from a deck to a player's hand.

## 3 Proposed plan for implementing card animations

### 3.1 Choose an animation library

- **Framer Motion** is recommended for this project because it is declarative, works seamlessly with React/Next.js, supports server‑side rendering, and provides built‑in FLIP‑style layout animations. The AnimatePresence, motion elements and LayoutGroup can animate cards entering, leaving or moving between different lists. Framer Motion also offers spring physics with customisable stiffness, damping and bounce, enabling bounce and rotation effects similar to the Framer card stack demo[\[5\]](https://www.framer.com/marketplace/components/card-stack/#:~:text=Swipe%20through%20a%20stack%20of,intros%2C%20or%20playful%20UI%20moments).
- **Alternate options**: GSAP provides fine‑grained control and draggable interactions, as shown in the GSAP deck example[\[6\]](https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919#:~:text=The%20Stack). It could be used for special effects (e.g., shuffle animations), but integrating it with React is more imperative and requires managing refs and effect hooks. React‑Spring is another alternative; however, Framer Motion's layoutId feature simplifies cross‑container animations.

### 3.2 High‑level architecture changes

- **Introduce a CardAnimation context** - Create a React context in the UI layer that stores references to card elements (via refs) and provides API functions such as animateMove(cardId, fromContainer, toContainer, animationOptions). This context can coordinate when a card is drawn from the deck to a row or discarded. It also keeps track of positions using getBoundingClientRect() so that custom animations (non‑layout) can be performed if necessary.
- **Wrap card containers with Framer Motion components** - Convert each card container inside CardRow and CardStack into a motion.div with a unique layoutId derived from the card's id (e.g., layoutId={\\card-\${card.id}}). Place the different card containers (deck, player hand, discard pile) inside a sharedLayoutGroup\` so Framer Motion can animate the card between these containers.
- **Use AnimatePresence for adding/removing cards** - When a card leaves a container (e.g., drawn from the deck), wrap it in AnimatePresence and define exit properties (e.g., fade out + shrink). When it appears in the destination container, define initial and animate properties (e.g., fade in + grow). Framer Motion will automatically animate from the old position to the new one when the card id appears in a different container because they share the same layoutId.
- **Expose animation options through props** - Extend CardRowProps and CardStackProps with optional animation settings (e.g., animationDuration, animationType, springConfig). Provide reasonable defaults (e.g., a spring with stiffness: 500, damping: 30 for bounce) but allow game designers to override them.
- **Refactor dealing logic to trigger UI animations** - The game engine dispatches events when cards are drawn or discarded. The UI can listen to these events (via context or props callbacks) and update the array of cards for each container. Because the cards share layoutIds, changing the arrays will automatically trigger Framer Motion's layout animations. For cases where a card moves from the deck to the middle of a row, the layout prop handles the translation and rotation.
- **Add fancy effects** - Use Framer Motion's properties to implement:
- **Rotation** - For example, on hover or selection, set whileHover={{ rotate: 3 }} or animate continuous rotation for a special card.
- **Bounce** - Use a spring transition with higher bounce or lower damping, e.g., transition={{ type: 'spring', stiffness: 400, damping: 12, bounce: 0.3 }} to make cards "bounce" to their destination.
- **Flip** - To flip a card from face‑down to face‑up, animate the rotateY property from 180° to 0° or use CSS's backface‑visibility with Framer Motion.
- **Depth** - Slightly increase elevation (shadow) and scale when the card is moving or highlighted (similar to the selected effect currently implemented[\[1\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx#L160-L182)).

### 3.3 Integration with existing components

- **PlayingCard** - Wrap the root &lt;div&gt; in motion.div and forward animation props. Provide an optional flip animation when faceUp changes (e.g., animate={{ rotateY: card.faceUp ? 0 : 180 }} with transformStyle: 'preserve-3d'). Keep existing CSS variables for card dimensions.
- **CardRow** - Replace each absolute &lt;div&gt; with motion.div and add layout and layoutId. Use computed layout transforms as the initial style; Framer Motion will animate to new transforms automatically. Use AnimatePresence so that when a card leaves the row (played or discarded), it fades/shrinks gracefully rather than disappearing instantly.
- **CardStack** - Turn the deck into a list of motion.div elements with layoutIds. When drawing a card, remove it from the deck array; the card will animate from the deck's position to the player's row because of the shared layoutId. Optionally implement a custom draw animation: animate the card forward (scale up) before it moves to the hand.
- **Animation manager** - Provide a higher‑level component (e.g., &lt;CardAnimator /&gt;) that wraps the board. It could handle sequencing (dealing cards one by one with delays) or more complex animations like shuffling by randomising positions and using animate={{ x, y, rotate }} transitions.
- **Fallback** - Ensure that if JavaScript is disabled or if animations are not supported, the card UI still functions. Framer Motion degrades gracefully by outputting plain &lt;div&gt; elements when motion is not executed.

### 3.4 Implementation roadmap

- **Install Framer Motion** in the monorepo (pnpm add framer-motion) and add type definitions if necessary.
- **Create the AnimatedCard component** wrapping PlayingCard using motion.div. Support props like layoutId, flip, initial, animate, exit and default spring settings. Provide a consistent API for other components.
- **Refactor CardRow and CardStack** to use AnimatedCard and AnimatePresence with shared layoutIds. Use LayoutGroup or AnimateSharedLayout at a higher level (depending on Framer Motion version). Remove manual CSS transitions on transforms to avoid conflicts.
- **Add context and hooks** to register card positions and trigger custom animations when necessary (e.g., using useEffect with useLayoutEffect to measure positions for non‑layout animations).
- **Integrate with game logic** so that events (dealing, drawing, discarding) update UI states; the animations will run automatically. Provide optional callbacks (e.g., onAnimationEnd) so the game engine can continue after an animation completes.
- **Implement fancy effects** - Add rotation or bounce using Framer Motion's props. Provide configuration in the card meta (e.g., meta.tags could include shake or highlight) or pass explicit props.
- **Test and optimise** - Use Storybook or the existing CardRow.stories.tsx to verify animations. Profile performance on mobile devices and adjust spring settings. Provide an option to disable animations for accessibility.

## 5 Conclusion

The current vibe‑baodatui card UI uses static CSS transforms without animation. To implement rich card animations (dealing, moving, rotating, bouncing), we should adopt a dedicated animation library such as **Framer Motion**. Framer Motion's layout and layoutId features enable FLIP‑style animations across different containers, ensuring that cards smoothly transition from the deck to a player's hand or between rows. By refactoring PlayingCard, CardRow and CardStack into motion.div components and adding a CardAnimation context, we can introduce draw/discard animations, flip effects and bounce without rewriting game logic. The plan outlined above specifies the necessary architectural changes, integration steps and recommended animation settings to achieve a polished and engaging poker card UI.

[\[1\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx#L160-L182) [\[2\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx#L171-L182) CardRow.tsx

<https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/ui-cards/src/components/CardRow.tsx>

[\[3\]](https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/core-cards/src/types.ts#L15-L21) types.ts

<https://github.com/zt1106/vibe-baodatui/blob/HEAD/packages/core-cards/src/types.ts>

[\[4\]](https://github.com/therewillbecode/react-poker#:~:text=and%20facing%20up%20on%20the,community%20board) GitHub - therewillbecode/react-poker: A React Library For Poker Card Game Animations

<https://github.com/therewillbecode/react-poker>

[\[5\]](https://www.framer.com/marketplace/components/card-stack/#:~:text=Swipe%20through%20a%20stack%20of,intros%2C%20or%20playful%20UI%20moments) Card Stack: Free UI Component by Vlad - Framer Marketplace

<https://www.framer.com/marketplace/components/card-stack/>

[\[6\]](https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919#:~:text=The%20Stack) [\[7\]](https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919#:~:text=const%20,) Making an animated card deck Framer & React component | by Michalis Dobekidis | Medium

<https://mdobekidis.medium.com/making-an-animated-card-deck-framer-react-component-248398114919>