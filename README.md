# PDFJS-Validator

Extension for pdfjs to validate a pdf. Useful for playwright.

## Install

Run 

`pnpm add -D pdfjs-validator`

`npm i -D pdfjs-validator`

`yarn add -D pdfjs-validator`

## Usage

To test just a title use

```typescript
import { verifyPdf } from 'pdfjs-validator';

const validationErrors = await verifyPdf('https:...', { title: 'hello world!' });

expect(validationErrors.title).toBeUndefined();

```

You can test the title and some phrases in the pdf

```typescript
import { verifyPdf } from 'pdfjs-validator';

const validationErrors = await verifyPdf('https:...', { 
    title: 'hello world!' ,
    textPhrases: ['common phrase', 'kind regards']
});

expect(validationErrors.title).toBeUndefined();
expect(validationErrors.textPhrases).toBeUndefined();

```

In frontend code you also be able to use this, just by install the package in `dependencies` instead of `devDependencies`.

Can be useful for a prevalidation before upload a pdf to the backend or something similar.
