require 'rubygems'
require 'json'
require 'rake/clean'

CLEAN.include ['*.xpi', '*.rdf']
xpi_url = 'https://autopagerize.herokuapp.com/files/autopagerize_for_firefox-latest.xpi'
rdf_url = 'https://autopagerize.herokuapp.com/files/autopagerize_for_firefox.update.rdf'
dir = './deploy'

task :_xpi do
  sh "cfx xpi --output-file=autopagerize-amo.xpi"
  sh "cfx xpi --update-link='#{xpi_url}' --update-url='#{rdf_url}'"
end

desc 'deploy'
task :deploy => :update do
  v = JSON.parse(IO.read('package.json'))['version']
  sh "cp autopagerize-amo.xpi #{dir}/autopagerize_for_firefox-amo-#{v}.xpi"
  sh "cp autopagerize.xpi #{dir}/autopagerize_for_firefox-latest.xpi"
  sh "cp autopagerize.xpi #{dir}/autopagerize_for_firefox-#{v}.xpi"
  sh "cp autopagerize.update.rdf #{dir}/autopagerize_for_firefox.update.rdf"
end

desc 'update xpi'
task :update => [:clean, :_xpi]
