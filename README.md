# What is going on?
you may ask yourself this questions, so did I some time ago, the year is 2021 and android did a change to the way apps have to be deployed. Adjusting seemed easy enough, but then the AndroidManifest-Nation attacked.

In the new package format (aab instead of an apk) AndroidManifest.xml files are actually not xml files, they are protobuf encoded files. At first there was an attempt in reusing our XML methods and thus converting the file, however this was futile so in the end the better choice was to edit the protobuf file directly, this is what this nodejs application does

At the time of this writing there were no reliable tools to convert between `AndroidManifest.xml` and its protobuf format, you could extract the `AndroidManifest.xml` with `bundletool`, but there was no reliable way of convertig the xml back to its protobuf versoion

if for some reason the reader is interested in this format, here is a documentation https://developers.google.com/protocol-buffers

# How does this tool work
```
Options:
  -v, --vers                        get the current version
  -p, --proto-dir <dir>             sets the elements at a given path based on an input map in json format (needs -p)
  -a, --app-dir <dir>               path to the unpacked aab
  --old-package-name <name>         change the occourcen of --old-package-name to --new-package-name
  --new-package-name <name>         only usable in conjunction with --old-package-name
  --delete-acitivty <activity>      delete an activity like: "com.google.android.gms.tagmanager.TagManagerPreviewActivity"
  --delete-permission <permission>  delete a permission like: "android.permission.ACCESS_BACKGROUND_LOCATION"
  --object-path <dir>               path of the object youw ant to manipulate (used for --set-elements)
  --set-elements <json>             sets the elements at a given path based on an input map in json format (needs -p)
  -m, --manifest <file>             android manifest file (default: <app-dir>/base/manifest/AndroidManifest.xml)
  -o, --output <dir>                output directory for the AndroidManifest.pb and AndroidManifest.json (default: output/)
  -h, --help                        display help for command
```
this explains most of the tool, you need to have decompressed the aab file to `--app-dir`

it is required to have the `Resources.proto` and `Configuration.proto` (not sure about that one) in the `--proto-dir`, you can get those files from the jar in the google maven aapt2 repository https://mvnrepository.com/artifact/com.android.tools.build/aapt2-proto?repo=google

the output dir will then contain the modified manifest called `AndroidManifest.pb`, this can be copied or overwrite the original manifest.
Additonally it will contain `AndroidManifest.json` just to have a readable format of what this tool did to the manifest

if you execute the tool without parameters it just writes the `AdnroidManifest.pb` and `AndroidManifest.json`, the json can help you to understand the protobuf format generated from your original AndroidManifest.xml

## Example
change package name:\
`node index.js --old-package-name com.oldname.android.app --new-package-name com.yourcompany.android.app`

change version:\
`node index.js --object-path element.attribute --set-elements examples/versions.json`

edit values in the manifest:\
`node index.js --object-path element.application.activity[0].intent-filter[1] --set-elements examples/data-attributes.json`

delete an activity:\
`node index.js --delete-acitivty com.google.android.gms.tagmanager.TagManagerPreviewActivity`

delete a permission:\
`node index.js --delete-permission android.permission.ACCESS_BACKGROUND_LOCATION`

# The Files
`index.js` - contols the script and prepares the data for the manipulation

`helpers.js` - this file contains the methods to edit the manifest, because of the way the format works (and is transformed to json) there is some different functionalities needed.

# The `proto` directory
The proto directory contains the .proto files, wich are the definitions of the protobuf files and how to read and write them.

The tool actually reads out the `Resources.proto` from this directory to be able to read and write the Andorid Manifest in it's protobuf format. If Android does update the Resource definitons we can just update those files and everything works again (for this project the XML parts in the `Resources.proto` file are the most important)

`Configuration.proto` is needed because there might be references