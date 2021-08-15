<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** github_username, repo_name, twitter_handle, email, project_title, project_description
-->

<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<!--
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
-->

<!-- PROJECT LOGO -->

  <!--<a href="https://github.com/BeAnMo/transfigure-json>
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>-->

# **Transfigure-JSON**

[![NPM](https://nodei.co/npm/transfigure-json.png?compact=true)](https://npm.im/transfigure-json)

Transfigure-JSON is a data transformation library that provides JSON compatible data a fluent interface for a chainable, Array-like API.
<br />
<a href="https://github.com/BeAnMo/transfigure-json/issues">Report Bug</a>
·
<a href="https://github.com/BeAnMo/transfigure-json/issues">Request Feature</a>
.
<a href="#docs-toc">Documentation</a>

## **Installation**

From NPM

```sh
npm install transfigure-json
```

From CDN

```html
<script src="https://cdn.jsdelivr.net/npm/transfigure-json"></script>
```

<hr />

## **Usage**

### Reddit Comments

Imagine your project needs to extract the text & scores from reddit comments. Comment pages are arbitrarily nested <a href="https://raw.githubusercontent.com/BeAnMo/transfigure-json/main/tests/reddit-comments.json" target="_blank" rel="noopener noreferrer">arrays of objects of arrays of objects</a> which can require dozens of lines of looping & null checking to extract the necessary data.

Transfigure-JSON does that work with a few chained methods.

```js
fetch(`${REDDIT_COMMENTS_URL}.json`)
  .then((r) => r.json())
  .then((json) => {
    const rows = new Transfigurator(json)
      .prune(({ key }) => "author score created body".includes(key)) // 1
      .fold((acc, { path, key, value }) => {
        // 2
        const root = path
          .slice(0, -1) // 3
          .join("/"); // 4
        return acc.set(`${root}.${key}`, value); // 5
      }, new Transfigurator({}))
      .toggle() // 6
      .get() // 7
      .map(([key, values]) => values); // 8

    console.table(rows);
  })
  .catch(console.error);
```

1. Prunes the comment tree for the specified keys. Keep in mind that just like an Array.filter.reduce chain, the pruning for Doc.prune.fold can be done entirely within the fold operation. Separating `prune` and `fold` simply makes it easier to swap out operations when changes are required.
2. Folds the pruned tree into a flattened Object of `{ ...key: { created, score, body, author } }`.
3. Moves up one from the current path to get the necessary root path (think `$ cd ..`).
4. The delimeter is replaced to allow using the whole root path as a single Object key. This prevents the recreation of the original shape by flattening the whole tree (`nested.path.to.key` becomes `nested/path/to.key`).
5. Update and return the accumulator Object `{...<path/to/object>: {...<key>: value } }`.
6. Converts the flattened tree into an array of `[...[key, { created, score, body, author }]]`.
7. Returns the current document.
8. The current document is easily handled by native array methods.

## **Caveats**

Currently, transfigure-json only supports JSON-compatible objects.

For a refresher, a JSON-compatible object is one of:

- Booleans
- Numbers
- Strings
- Objects (of valid JSON)
- Arrays (of valid JSON)

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary class="h2"><span id="docs-toc">Documentation</span></summary>
  <ol>
    <li><a href="#document-interface">Document Interface</a></li>
    <li><a href="#instantiation">Instantiation</a></li>
    <li><a href="#iterating">Iterating</a>
    <li><a href="#json-path">JSON Path</a></li>
    <li><a href="#breadth-first-stream">Breadth First Stream</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

<!-- USAGE EXAMPLES -->

### **Document Interface**

<div class="highlight highlight-source-js">
<pre>
TransfiguratorInterface = {
    <a href="#static-clone">clone</a>(Object | Array) => Object | Array,
    <a href="#static-schema">schema</a>(Object | Array) => Object | Array
}
<br />
<a href="#instantiation">TransfiguratorInstance</a> = Transfigurator(doc: Object | Array, options?: Object)
<br />
InstanceInterface = {
    <a href="#instance-get">get</a> (path?: <a href="#json-path">ValidPath</a>, options?: { useConstructor: false }) => TransfiguratorInstance | Object | Array,
    <a href="#instance-set">set</a>(path: ValidPath, value: any) => TransfiguratorInstance,
    <a href="#iterating-fold">fold</a>(proc: (accumulator: any, item: <a href="#breadth-first-stream">StreamItem</a>) => any, accumulator: any) => any,
    <a href="#iterating-transform">transform</a>(proc: (item: StreamItem) => any) => TransfiguratorInstance,
    <a href="#iterating-prune">prune</a>(predicate: (item: StreamItem) => boolean) => TransfiguratorInstance,
    <a href="#iterating-each">each</a>(proc: (item: StreamItem) => any) => TransfiguratorInstance,
    <a href="#iterating-select">select</a>(predicate: (item: StreamItem) => boolean) => StreamItem,
    <a href="#iterating-smoosh">smoosh</a>() => TransfiguratorInstance,
    <a href="#iterating-toggle">toggle</a>() => TransfiguratorInstance,
    <a href="#iterating-toStream">toStream</a>() => <a href="#breadth-first-stream">BFSteamInstance</a>
}

</pre>
</div>

<hr />

### **Instantiation**

Options:
| Key | ValueType | Default | Description |
|-----|-----------|---------|-------------|
| delimeter | `string` | `"."` | The delimeter for paths (e.g. 'rootKey.0.aChildKey' or 'rootKey/0/aChildKey'). |
| useConstructor | `boolean` | `false` | Return a Transfigurator instance when retrieving a specifc key instead of the raw value (only for Objects/Arrays). |

```js
/* Commons JS compatible */
import Transfigurator from "transfigure-json";
/* Available as Transfigurator when using a script tag */

const test = {
  a: 1,
  b: 2,
  c: 3,
};

// "new" is optional.
const docInstance = new Transfigurator(test);
const docInstance = Transfigurator(test);
// Use a custom delimeter.
const docInstance = Transfigurator(test, { delimeter: "***" });
```

If passed invalid JSON, JsonData will throw an error. If passed a Number/String/Boolean/null, JsonData will simply return the given argument.

A document instance wraps the given object. For testing/debugging, consider deep-cloning an object before passing it to the constructor to prevent unwanted mutations.

- **<span id="instance-get">.get</span>**
  - Returns the document at the given <a href="#json-path">path</a>. If not path is provided, `get` returns the full document. If the `useConstructor` option is set to `true`, a new TransfiguratorInstance will be returned if the given path points to an Object or Array.
- **<span id="instance-set">.set</span>**
  - Mutates the Transfigurator instance at the given path with a value and returns the instance.

#### Static methods

- **<span id="static-clone">.clone</span>**
  - Performs a deep clone of the given object.
- **<span id="static-schema">.schema</span>**
  - Replaces the primitive values of an object with strings denoting the type ("string", "number", "boolean", "null").

<hr />

### **Iterating**

Part of the goal of transfigure-json is to give users an interface comparable to native Array methods, providing a concise, chainable API. Rather than copy Array method names, transfigure-json uses alternates to ensure a user can bounce between transfigure-json and Array methods without confusion.

| Array   | Transfigure-JSON |
| ------- | ---------------- |
| reduce  | fold             |
| map     | transform        |
| filter  | prune            |
| forEach | each             |
| find    | select           |

The callbacks for all iterative instance methods bind the current instance to `this`.

- **<span id="iterating-fold">.fold</span>**
  - Object keys are assumed to be unordered, which means there is no `Array.reduceRight` equivalent.
- **<span id="iterating-transform">.transform</span>**
  - Maps a procedure to each value in a doc.
- **<span id="iterating-prune">.prune</span>**
  - "Prunes" a tree returning all values that match the predicate function but maintains the shape of the original document. This may return sparse arrays.
- **<span id="iterating-each">.each</span>**
  - Applies the given procedure to each value but does not return a result, but instead returns the instance to allow for chaining.
- **<span id="iterating-select">.select</span>**
  - Returns the first value that matches the predicate or `undefined`.
- **<span id="iterating-smoosh">.smoosh</span>**
  - Completely flattens an object to a single of Object of `{...string<JFPath>: any }`.
- **<span id="iterating-toggle">.toggle</span>**
  - Toggles the root object between Object and Array. Toggling Object->Array creates `[...[string<key>, any]]` and Array->Object creates `{...number: any}`.
- **<span id="iterating-toStream">.toStream</span>**
  - Exposes a <a href="#breadth-first-stream">breath-first stream</a> of the instance.

<hr />

### **JSON Path**

A Path is a convenience wrapper to abstract the swapping of path strings and arrays and path navigation.

<div class="highlight highlight-source-js">
<pre>
JsonPathInstance = new JsonPath(string | string[], delimeter: string)
<br />
ValidPath = JsonPathInstance | string | string[]
<br />
InstanceInterface = {
    toString() => string
    toArray() => Array,
    join(delimiter?: string) => string,
    clone() => JsonPathInstance,
    slice(from?: number, to?: number) => JsonPathInstance,
    append(key: string | number) => JsonPathInstance
}
</pre>
</div>

- **.toString**
  - Returns the current path array as a string separated by the current delimiter.
- **.toArray**
  - Return the current path array.
- **.join**
  - With no argument provided, `path.join` calls `path.toString`. if a string argument is provided, it will join the current path array by the given string.
- **.clone**
  - Creates a clone using the current path array and delimiter.
- **.slice**
  - Mimics `Array.slice` & `String.slice`. Returns a new path instance based on the selection of `from` and `to`.
- **.append**
  - Mutates the current instance by appending a key at the end of the current path. Returns the instance.

<hr />

### **Breadth First Stream**

Transfigure-JSON uses a breadth-first stream of primitives under the hood. The algorithm will always emit primitive values instead of their encompassing Objects/Arrays. Array indexes are cast as strings.

<div class="highlight highlight-source-js">
<pre>
BFStreamInstance = new BFStream(Object | Array, delimeter: string)
<br />
StreamItem = Object<{
    path: <a href="#json-path">JsonPathInstance</a>,
    key: string,
    value: null | boolean | number | string
}>
<br />
InstanceInterface = {
    private setQueue(path: JsonPath, key: string[]) => BFStreamInstance,
    empty() => boolean,
    next() => StreamItem
}
</pre>
</div>

- **.empty**
  - Returns `true` if the queue is empty.
- **.next**
  - Returns the next `StreamItem` within an object. Returns `null` when the stream has ended.

<hr />

<!-- CONTRIBUTING -->

## **Contributing**

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

<hr />

## **License**

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

<hr />

## **Contact**

Project Link: [https://github.com/BeAnMo/transfigure-json](https://github.com/BeAnMo/transfigure-json)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/BeAnMo/repo.svg?style=for-the-badge
[contributors-url]: https://github.com/BeAnMo/repo/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/BeAnMo/repo.svg?style=for-the-badge
[forks-url]: https://github.com/BeAnMo/repo/network/members
[stars-shield]: https://img.shields.io/github/stars/BeAnMo/repo.svg?style=for-the-badge
[stars-url]: https://github.com/BeAnMo/repo/stargazers
[issues-shield]: https://img.shields.io/github/issues/BeAnMo/repo.svg?style=for-the-badge
[issues-url]: https://github.com/BeAnMo/repo/issues
[license-shield]: https://img.shields.io/github/license/BeAnMo/repo.svg?style=for-the-badge
[license-url]: https://github.com/BeAnMo/repo/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/github_username
