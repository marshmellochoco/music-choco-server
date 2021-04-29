# react-music-player-server API
### by marshmellochoco

<table>
    <thead>
        <tr>
            <th>URL</th>
            <th>Method</th>
            <th>Response</th>
            <th>Response Type</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>/album</td>
            <td>GET</td>
            <td>Data of all albums</td>
            <td>JSON</td>
        </tr>
        <tr>
            <td>/album</td>
            <td>POST</td>
            <td>"Done"</td>
            <td>a string lol</td>
        </tr>
        <tr>
            <td>/album/:albumid</td>
            <td>GET</td>
            <td>Data of a specific albums</td>
            <td>JSON</td>
        </tr>
        <tr>
            <td>/album/:albumid/ico</td>
            <td>GET</td>
            <td>Icon of a specific album</td>
            <td>Image</td>
        </tr>
        <tr>
            <td>/song</td>
            <td>POST</td>
            <td>"Done"</td>
            <td>a string lol</td>
        </tr>
        <tr>
            <td>/song/:songid</td>
            <td>GET</td>
            <td>Data of a specific song</td>
            <td>JSON</td>
        </tr>
        <tr>
            <td>/song/play/:songid</td>
            <td>GET</td>
            <td>Audio stream of a specific song</td>
            <td>Audio (.wav)</td>
        </tr>
    </tbody>
</table>
