require 'rake/clean'

CLEAN.include ['*.xpi', '*.rdf']

xpi_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize.xpi'
rdf_url = 'https://relucks-org.appspot.com/autopagerize/autopagerize.update.rdf'
dir = '/Users/youhei/dev/appengine/relucks-org/files'

task :xpi do
  sh "cfx xpi -u '#{rdf_url}' -l '#{xpi_url}'"
end

task :dep => :xpi do
  sh "cp autopagerize.xpi autopagerize.update.rdf #{dir} && cd #{dir}/.. && sh ./script/update"
end


