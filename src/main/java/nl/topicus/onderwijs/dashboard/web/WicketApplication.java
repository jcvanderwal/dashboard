package nl.topicus.onderwijs.dashboard.web;

import java.util.List;

import nl.topicus.onderwijs.dashboard.modules.Project;
import nl.topicus.onderwijs.dashboard.modules.RandomDataRepositoryImpl;
import nl.topicus.onderwijs.dashboard.modules.Repository;
import nl.topicus.onderwijs.dashboard.modules.RepositoryImpl;
import nl.topicus.onderwijs.dashboard.timers.Updater;
import nl.topicus.onderwijs.dashboard.web.pages.DashboardPage;

import org.apache.wicket.Application;
import org.apache.wicket.Request;
import org.apache.wicket.Response;
import org.apache.wicket.Session;
import org.apache.wicket.protocol.http.WebApplication;

/**
 * Application object for your web application. If you want to run this
 * application without deploying, run the Start class.
 * 
 * @see nl.topicus.onderwijs.dashboard.Start#main(String[])
 */
public class WicketApplication extends WebApplication {
	private Updater updater;

	private Repository repository = new RepositoryImpl();

	private Repository randomRepository = new RandomDataRepositoryImpl(
			repository);

	@Override
	public Class<DashboardPage> getHomePage() {
		return DashboardPage.class;
	}

	@Override
	protected void init() {
		super.init();

		// if (Application.DEPLOYMENT.equals(getConfigurationType())) {
		// WicketApplication.get().enableLiveUpdater();
		// }
		getMarkupSettings().setStripWicketTags(true);
	}

	public List<Project> getProjects() {
		return getRepository().getProjects();
	}

	public void enableLiveUpdater() {
		updater = new Updater(randomRepository);
	}

	public void disableLiveUpdater() {
		if (updater != null) {
			updater.stop();
			updater = null;
		}
	}

	public boolean isUpdaterEnabled() {
		return updater == null;
	}

	@Override
	public Session newSession(Request request, Response response) {
		return new DashboardWebSession(request);
	}

	public static WicketApplication get() {
		return (WicketApplication) WebApplication.get();
	}

	public boolean isDevelopment() {
		return Application.DEVELOPMENT.equals(getConfigurationType());
	}

	public Repository getRepository() {
		if (DashboardWebSession.get().getMode() == DashboardMode.RandomData)
			return randomRepository;
		return repository;
	}
}
