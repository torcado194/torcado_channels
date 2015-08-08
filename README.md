# torcado_channels
A Tumblr XKit extension that adds custom channels to the dashboard so you can sort your blogs and view selective content.
## How To Install
XKit is required. Get the last official release on the [official download page](http://www.xkit.info/download), or get the [currently maintained unofficial fork here](https://github.com/new-xkit/XKit).

With XKit installed, go to https://www.tumblr.com/xkit_editor and add a new extension named exactly "torcado_channels".

Paste the contents of the ["torcado_channels.js"](https://github.com/torcado194/torcado_channels/blob/master/torcado_channels.js) file in the "script" tab of the new extension, the contents of the ["torcado_channels.css"](https://github.com/torcado194/torcado_channels/blob/master/torcado_channels.css) file in the "stylesheet" tab, and the contents of the ["icon.txt"](https://github.com/torcado194/torcado_channels/blob/master/icon.txt) file in the "icon" tab.

## How To Use
A new control panel will be added beneath the "New Post" controls.

#### Creating a channel
From here you can click the plus button to add a new channel.

Choose a name and a color (either by typing a valid hexadecimal color or clicking the randomize button) and click save.

#### Adding blogs to a channel
Now you can add blogs to the channel through a few ways:
- Click the small plus icon next to the channel and type the names of the blogs you want to add (comma separated)
- Click the dropdown found to the right of every post to add that blog to a channel
- Click the "add to channels" button found in the blog popover box when hovering over a blog name or icon (button is below the follow button)
- Go to the ["following"](https://www.tumblr.com/following) page and click the "add to channels" button found next to each blog you follow
- (Not reccommended) Manually edit the channels data by clicking the "export/import" button on the bottom left of the control panel

#### Editing a channel
Click the gear icon next to a channel to edit its settings.
You can change its name and color, and remove blogs.
You can also delete a channel entirely, if you'd like.

#### Filtering posts
This is what toggles the core function of the extension. When on, you will only see posts on your dash from blogs sorted under the currently active channels.
To activate/deactivate a channel, just click on the channel button.

(A more in-depth description of this functionality can be found on the [filter posts wiki page](https://github.com/torcado194/torcado_channels/wiki/Filter-Posts).

#### Coloring posts
Posts sorted under a channel will have their background color changed to match the color of the channel.
If a blog is sorted under multiple channels, the color matches the first active channel (in the order shown on the control panel)
If a channel is not active, it will not color posts.

#### Exporting/Importing channel data
Clicking on the "export/import" button on the bottom left of the control panel will show a dialog box of the current channel data.
You can copy this data to save it elsewhere, or to send to a different computer or account, for example.

To import channel data, delete the contents of the textarea and paste in the new data, then click "import".

You can also edit the data manually directly in the textarea to change settings. Check the [wiki page on channel data](https://github.com/torcado194/torcado_channels/wiki/Channel-Data) to see how it's formatted

BE CAREFUL WHEN IMPORTING/CHANGING CHANNEL DATA. There is no backup for this. I suggest saving the original data elsewhere just in case.

## THANK YOU
I hope you find use in this extension! If you find any bugs or issues, or have any suggestions, submit them in this repository or shoot me an ask at http://www.torcado.tumblr.com!
