require 'rubygems'
require 'json'
require 'rake/clean'

CLEAN.include ['*.xpi', '*.rdf']

xpi_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize.xpi'
rdf_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize.update.rdf'
dir = '/Users/youhei/dev/appengine/relucks-org/files'

task :_xpi do
  sh "cfx xpi -u '#{rdf_url}' -l '#{xpi_url}'"
end

task :dep => :xpi do
  sh "cp autopagerize.xpi autopagerize.update.rdf #{dir} && cd #{dir}/.. && sh ./script/update"
end

task :xpi => [:clean, :_xpi] do
  v = JSON.parse(IO.read('package.json'))['version']
  # inject_meta
  sh "cp autopagerize.xpi packages_/autopagerize_#{v}.xpi"
end

def inject_meta
  sh 'unzip -q -d tmp autopagerize.xpi'
  path = 'tmp/install.rdf'
  s = IO.read path
  rs = <<-EOS
<em:iconURL>chrome://autopagerize/content/icons/icon_032.png</em:iconURL>
    <em:homepageURL>chrome://autopagerize/content/icons/icon_032.png</em:homepageURL>
EOS
  s.gsub!('<em:iconURL/>', rs)
  open(path, 'w') {|f| f.write(s) }
  open('tmp/chrome.manifest', 'w') {|f|
    f.puts('content autopagerize resources/jid0-tkjnea5x3ebop5hnqjbyq4u3acm-autopagerize-data/')
  }
  sh 'cd tmp && zip -qr -9 autopagerize.xpi * && mv autopagerize.xpi ../ && cd ../'
  sh 'rm -rf tmp'
end
