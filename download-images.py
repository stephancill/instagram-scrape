import sys
import os
import urllib
import threading
import queue as Q
import urllib.request

downloads_count = 0
downloaded_count = 0

class DownloadThread(threading.Thread):
    def __init__(self, queue, destfolder):
        super(DownloadThread, self).__init__()
        self.queue = queue
        self.destfolder = destfolder
        self.daemon = True
        self.initial_queue_size = queue.qsize()

    def run(self):
        while True:
            url = self.queue.get()
            try:
                self.download_url(url)
            except Exception as e:
                print( "   Error: {}".format(e))
            self.queue.task_done()

    def download_url(self, url):
        # change it to a different way if you require
        name = "-".join(url.split("/")).replace(":", "")
        dest = os.path.join(self.destfolder, name)
        print ("Downloading ({}%)".format(round((self.initial_queue_size-self.queue.qsize())/self.initial_queue_size*10000)/100))
        urllib.request.urlretrieve(url, dest)

def download(urls, destfolder, numthreads=4):
    queue = Q.Queue()
    for url in urls:
        queue.put(url)

    for i in range(numthreads):
        t = DownloadThread(queue, destfolder)
        t.start()

    queue.join()

if __name__ == "__main__":
    urls = []
    with open(sys.argv[1]) as f:
        urls = [x.strip('\n') for x in f]
    dest = "{0}/{1}/{2}".format("scraped-images", sys.argv[1].split("/")[1], sys.argv[1].split("/")[2].split(".txt")[0])
    print(dest)
    if not os.path.isdir(dest):
        os.makedirs( dest );
    downloads_count = len(urls)
    download(urls, dest)
