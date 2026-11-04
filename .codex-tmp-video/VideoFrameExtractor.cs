using System;
using System.Globalization;
using System.Threading.Tasks;
using Windows.Media.Editing;
using Windows.Media.MediaProperties;
using Windows.Storage;
using Windows.Storage.Streams;

internal static class VideoFrameExtractor
{
    private static void Main(string[] args)
    {
        ExtractFrames(args[0], args[1]).GetAwaiter().GetResult();
    }

    private static async Task ExtractFrames(string sourcePath, string outputFolderPath)
    {
        StorageFile source = await StorageFile.GetFileFromPathAsync(sourcePath);
        MediaClip clip = await MediaClip.CreateFromFileAsync(source);
        MediaComposition composition = new MediaComposition();
        composition.Clips.Add(clip);
        StorageFolder outputFolder = await StorageFolder.GetFolderFromPathAsync(outputFolderPath);
        double duration = composition.Duration.TotalSeconds;

        for (int index = 0; index < 6; index++)
        {
            double seconds = duration <= 0 ? 0 : duration * index / 5.0;
            IRandomAccessStreamWithContentType thumbnail = await composition.GetThumbnailAsync(
                TimeSpan.FromSeconds(Math.Max(0, seconds - 0.05)),
                0,
                0,
                VideoFramePrecision.NearestFrame);
            StorageFile output = await outputFolder.CreateFileAsync(
                string.Format(CultureInfo.InvariantCulture, "frame-{0:00}.jpg", index),
                CreationCollisionOption.ReplaceExisting);
            IRandomAccessStream stream = await output.OpenAsync(FileAccessMode.ReadWrite);
            await RandomAccessStream.CopyAsync(thumbnail, stream);
            await stream.FlushAsync();
            thumbnail.Dispose();
            stream.Dispose();
        }

        Console.WriteLine(duration.ToString("F3", CultureInfo.InvariantCulture));
    }
}
