require 'rubygems'
require 'json'
require 'rake/clean'

CLEAN.include ['*.xpi', '*.rdf']
xpi_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize-latest.xpi'
rdf_url = 'https://relucks-org.appspot.com/autopagerize/update.rdf'
dir = '/Users/youhei/dev/appengine/relucks-org/files'

task :_xpi do
  sh "cfx xpi --update-link='#{xpi_url}' --update-url='#{rdf_url}'"
end

desc 'deploy'
task :deploy => :update do
  sh "cp autopagerize.xpi #{dir}/autopagerize-latest.xpi"
  sh "cp autopagerize.update.rdf #{dir}"
  sh "cp autopagerize.update.rdf #{dir}/update.rdf "
  sh "cp autopagerize.update.rdf #{dir}/autopagerize.xpi "
end

desc 'update xpi'
task :update => [:clean, :_xpi] do
  v = JSON.parse(IO.read('package.json'))['version']
  sh "cp autopagerize.xpi packages_/autopagerize_#{v}.xpi"
end
