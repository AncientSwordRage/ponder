# ponder

> “This sort of innovation occurs when you set out to improve an electric tea kettle and misplace a decimal.” 
> - Cosmotronic Wave

Ponder uses a Linear Programming techniques to take a large set of cards (more than the deck size), a bunch of constraints, and find the optimal* combination of cards. 

Optimal deck not guaranteed.*

-----

The cards are input as a CSV, with names in the first column, categories for the cards as the header, and for each combination a score of some sort.

| Card Names    | Card Draw | Ramp  | Damage |
| ------------- |-----------| ------|--------|
| Ponder        | 1         | 0     | 0      |
| Cultivate     | 0         | 3     | 0      |
| Lightning Bolt| 0         | 0     | 3      |

Here, our constraints are the 'Card Draw', 'Ramp' and 'Damage'.

After 'Solving' the constrains and cards, the program outputs three different pieces of information.

## Vertices

Vertices are the solutions to individual constraints, which can act as proposed decks. 

Any cards with a score of 0 are not included in the proposed decks.

## Midpoint

The midpoint is the arithmetic mean of all decks.

## Ranges

A summary of the mins and maxes of all decks.

----

## Tuning

Tuning the decks can be done inside index.js. Add or remove constraints to the `tacticsConstraints` entries, this can be informed from the ranges object, and the midpoint. For instance, often a certain amount of Ramp is recommended for all decks, which could be enforced with `[['Ramp', { min: 10 }]]`.

The scores in the sample_data csv can be adjusted. Currently they are scored 0-3, but if you only included good cards, ranking them 0 - 1 could allow you to enforce 10 ramp cards regardless of quality.

Deck size, card limit and land count can be adjusted as well inside index.js

## Running

To run the program, first check it out from github, and install all dependencies:

    npm install

Then call the main program with

    npm run opt

-----

### Caveats

This programe does not (yet) do the following:

 * Account for mana costs
 * Prevent you from spending all night searching Scryfall for more cards
 * Account for pet cards
 * Lockdown due to pandemics
 * Having to read papers on Multi-objective Knapsack problems
 * Account for converted mana cost
 * Unfair moderation on Reddit
 * Terrible choice of cards in the example data
 * Account for a good Mana Curve
 * Convince you to run more lands in EDH
 * Stop WotC from concealing top 8 lists
 * Prevent <undesired topic> being posted too often on Reddit
 * Account for cards already in your collection
